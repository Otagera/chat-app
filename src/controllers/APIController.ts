import { Request, Response, NextFunction } from 'express';
import Cryptr from 'cryptr';
import { get, post, bodyValidator, controller, del, use } from './decorators/index';
import * as socketio from 'socket.io';
import { io, redisClient } from '../app';
import mongoose from 'mongoose';
import { 
	User,
	Usernames,
	UserWithId,
	UserWithSave,
	UserBaseDocument,
	Msg,
	MsgWithSave,
	MsgBaseDocument,
	ChainEmmiter,
	RequestWithBody,
	RequestWithParams
} from '../interfaces';
import { upload, chatAuth, clearUploads } from '../middlewares';

import { sids, onlines } from '../app';

const Message = mongoose.model('Message');
const UserModel = mongoose.model('User');
const cryptr = new Cryptr(process.env.CRYPTR_KEY);

const testm = (req, res, next)=>{
	console.log('test');
	next();
}

@controller('/api')
class APIController {
	@get('/messages/all')
	getAllMessages(req: Request, res: Response){
		const options = {
			page: 1,
			limit: 10,
			sort: { timeSent: 1 },
		}
		Message.paginate({}, options, (err, result)=>{
			console.log(result);
		});
		const msgRedisKey = `messages`;
		try{
			redisClient.get(msgRedisKey, async (err, messages)=>{
				if(err) throw err;

				if(messages){
					const data = { source: 'cache', messages: JSON.parse(messages) };
					return res.statusJson(200, { data: data });
				}else{
					Message.find({}, 'message timeSent sender receiver', { lean: true })
						.exec()
						.then((messages: Msg[])=>{
							if(!messages){
								return res.statusJson(404, { data: { message: 'Empty' } });
							}
							for(let i = 0; i < messages.length; i++){
								messages[i].message = cryptr.decrypt(messages[i].message);
							}
							redisClient.setex(msgRedisKey, 3600, JSON.stringify(messages));
							const data = { source: 'db', messages: messages };
							return res.statusJson(200, { data: data });
						}).catch(err=>{
							const data = { message: err.messgae };
							if(err){ return res.statusJson(500, { data: data }); }
						});
				}
			});
		} catch(err){
			const data = { message: err.messgae };
			if(err){ return res.statusJson(500, { data: data }); }
		}
	}

	@get('/messages/all/:sender/:receiver')
	getSenderReceiverMessage(req: Request, res: Response){
		const { sender, receiver } = req.params;
		const msgRedisKey = `msgs-sender:${sender}-receiver:${receiver}`;
		const findMesage = ()=>{
			Message.find({ $and: [{'sender': { $in: [sender, receiver] }}, {'receiver': { $in: [sender, receiver] }}] })
				.exec()
				.then(async (messages: MsgWithSave[])=>{
					if(!messages){
						return res.statusJson(404, { data: { message: 'Empty' } });
					}
					for(let i = 0; i < messages.length; i++){
						if(!messages[i].read && messages[i].receiver === sender){
							try{
								messages[i].read = true;
								messages[i] = await messages[i].save();								
							}
							catch(err){
								const data = { err: err };
								if(err){ return res.statusJson(500, { data: data }); }
							}
						}
						messages[i].message = cryptr.decrypt(messages[i].message);
					}
					redisClient.setex(msgRedisKey, 3600, JSON.stringify(messages));
					const data = { source: 'db', messages: messages };
					return res.statusJson(200, { data: data });
				}).catch(err=>{
					const data = { message: err.messgae };
					if(err){ return res.statusJson(500, { data: data }); }
				});
		}
		try{
			redisClient.get(msgRedisKey, async (err, messages)=>{
				if(err) throw err;

				if(messages){
					const data = { source: 'cache', messages: JSON.parse(messages) };
					return res.statusJson(200, { data: data });
				}else{
					findMesage();
				}
			});
		} catch(err){
			const data = { message: err.messgae };
			if(err){ return res.statusJson(500, { data: data }); }
		}
	}

	@post('/message')
	@bodyValidator('msg', 'sender', 'receiver', 'typeOfMsg')
	sendMessage(req: RequestWithBody, res: Response){
		const { body, file } = req;
		const { msg, sender, receiver, typeOfMsg } = body;

		const receiverInChatroom = (): boolean=>{
			let inChatroom = false;
			sids.forEach((usernames: Usernames, id: string)=>{
		      if(usernames.receiver === sender && usernames.sender === receiver) {
		      	inChatroom = true;
		      }
		    });
			return inChatroom;
		}
		enum MsgTypeEnum {
			text = 'text',
			img = 'img',
			otherfile = 'otherfile'
		}
		
		const message: Msg = {
			message: cryptr.encrypt(msg),
			sender: sender,
			receiver: receiver,
			read: receiverInChatroom(),
			typeOfMsg: MsgTypeEnum[typeOfMsg],
	    	fileURL: (file)? file.path: '',
		};

		const chainIO = ({ localIO, socketsToSendTo }: ChainEmmiter ): ChainEmmiter=>{
			sids.forEach((usernames: Usernames, id: string)=>{
		      if( (usernames.receiver === receiver && usernames.sender === sender) || (usernames.receiver === sender && usernames.sender === receiver) ) {
		      	socketsToSendTo = true;
		      	//chain rooms based on the users id
		      	localIO = localIO.to(id);
		      }
		    });
			onlines.forEach((onlineInfo: OnlineInfo, id: string)=>{
		      if( (onlineInfo.username === receiver) || (onlineInfo.username === sender) ) {
		      	socketsToSendTo = true;
		      	//chain rooms based on the users id
		      	localIO = localIO.to(id);
		      }
		    });
			return { localIO, socketsToSendTo };
		}
		const emitter = ({ localIO, socketsToSendTo }: ChainEmmiter, dataToSend: { [key: string]: string | Date } ): void=>{
			if(socketsToSendTo){
				localIO.emit('send-msg', dataToSend);
			}
		}
		const findUserUpdateConversation = (): void =>{
			UserModel.find({'username': { $in: [sender, receiver] }})
				.exec()
				.then(async (users: UserWithSave[]): Promise<any>=>{
					if(users.length < 1){
						return res.statusJson(401, { data: { message: 'Not found' } });
					}
					for(let i = 0; i < users.length; i++){
						try{
							const localWithWho =  (users[i].username === sender)? receiver: sender;
							const localConvos = users[i].conversations;
							const receiverConvo: Conversation = { withWho: localWithWho, unreadMsgs: 1 };
							const senderConvo: Conversation = { withWho: localWithWho, unreadMsgs: 0 };
							if(localConvos.length < 1){
								if(users[i].username === receiver){
									localConvos.push(receiverConvo);
								}else{
									localConvos.push(senderConvo);
								}
							}else{
								let convoExist = localConvos.some((convo)=>{
									return convo.withWho === localWithWho;
								});
								if(!convoExist){
									if(users[i].username === receiver){
										localConvos.push(receiverConvo);
									}else{
										localConvos.push(senderConvo);
									}
								}else{
									for(let j = 0; j < localConvos.length; j++){
										if(localConvos[j].withWho === localWithWho && users[i].username === receiver){
											localConvos[j].unreadMsgs += 1;
										}
									}
								}
							}
							users[i].conversations = localConvos;
							users[i] = await users[i].save();
						}
						catch(err){
							const data = { err: err };
							if(err){ return res.statusJson(500, { data: data }); }
						}						
					}
				})
				.catch(err=>{
					throw new Error(err);
				});
		}
		const deleteCache = (): void =>{
			const msgRedisKeySR = `msgs-sender:${sender}-receiver:${receiver}`;
			const msgRedisKeyRS = `msgs-sender:${receiver}-receiver:${sender}`;
			const msgRedisKeyRRecent = `lstActiveConvo-username:${sender}`;
			const msgRedisKeySRecent = `lstActiveConvo-username:${receiver}`;
			try{
				redisClient.get(msgRedisKeySR, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeySR)}
				});
				redisClient.get(msgRedisKeyRS, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRS)}
				});
				redisClient.get(msgRedisKeyRRecent, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRRecent)}
				});
				redisClient.get(msgRedisKeySRecent, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeySRecent)}
				});
			}catch(err){}
		}
		Message.create(message).then((newMsg: Msg) => {
			//emit only to the sender and the receiver so they both
			//can register it on their respoective screens.
			deleteCache();
			emitter(
				chainIO({ 
					localIO: io,
					socketsToSendTo: false
				}),
				{
					message: cryptr.decrypt(newMsg['message']),
					timeSent: newMsg['timeSent'],
					sender: newMsg['sender'],
					receiver: newMsg['receiver'],
					_id: newMsg['_id'],
				}
			);
			findUserUpdateConversation();
			const data = { success: true };
			return res.statusJson(200, { data: data });
		}).catch(err=>{
			const data = { err: err, success: false };
			return res.statusJson(500, { data: data });
		});
	}

	@get('/messages/recent/:username')
	@use(testm)
	getLastMessagesOfConversations(req: Request, res: Response){
		const { username } = req.params;
		const msgRedisKey = `lstActiveConvo-username:${username}`;
		try{
			redisClient.get(msgRedisKey, async (err, messages)=>{
				if(err) throw err;
				let data = {
					source: '',
					messages: []
				}
				if(JSON.parse(messages)){
					data.source = 'cache';
					data.messages = JSON.parse(messages);
					return res.statusJson(200, { data: data });
				}else{
					UserModel.findOne({ 'username': username })
						.exec()
						.then((user: User)=>{
							let promises = [];
							user.conversations.forEach((convo)=>{
								promises.push(new Promise<Msg>(async (resolve, reject)=>{
									try{
										let msg: Msg = await Message.findOne({ $and: [{'sender': { $in: [username, convo.withWho] }}, {'receiver': { $in: [username, convo.withWho] }}] }).sort({ timeSent: -1 });
										msg.message = cryptr.decrypt(msg.message);
										resolve(msg);
									}catch(err){
										reject(err);
										console.log(err);
									}
								}))
							});
							Promise.all(promises).then((msg: Msg[])=>{
								data.source = 'db';
								data.messages = msg;
								redisClient.setex(msgRedisKey, 3600, JSON.stringify(msg));
								return res.statusJson(200, { data: data });							
							});
						})
						.catch(err=>{
							const data = { message: err.messgae };
							if(err){ return res.statusJson(500, { data: data }); }				
						});
				}
			});
		}catch(err){
			const data = { message: err.messgae };
			if(err){ return res.statusJson(500, { data: data }); }
		}
	}

	@get('/active-conversations/:username')
	getUserActiveConversations(req: Request, res: Response){
		const { username } = req.params;
		UserModel.findOne({ 'username': username })
				.exec()
				.then((user: User)=>{
					if(!user){
						return res.statusJson(203, { data: { message: 'No user!'} });
					}
					const data = {
						conversations: user.conversations
					};
					return res.statusJson(200, { data: data });
				}).catch(err=>{
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				});
	}

	@post('/user/clear-unread')
	@bodyValidator('sender', 'receiver')
	clearUserUnreadMsgs(req: RequestWithBody, res: Response){
		const { sender, receiver } = req.body;
		const chainIO = ({ localIO, socketsToSendTo }: ChainEmmiter ): ChainEmmiter=>{
			sids.forEach((usernames: Usernames, id: string)=>{
		      if( (usernames.receiver === receiver && usernames.sender === sender) || (usernames.receiver === sender && usernames.sender === receiver) ) {
		      	socketsToSendTo = true;
		      	//chain rooms based on the users id
		      	localIO = localIO.to(id);
		      }
		    });
			onlines.forEach((onlineInfo: OnlineInfo, id: string)=>{
		      if( (onlineInfo.username === receiver) || (onlineInfo.username === sender) ) {
		      	socketsToSendTo = true;
		      	//chain rooms based on the users id
		      	localIO = localIO.to(id);
		      }
		    });
			return { localIO, socketsToSendTo };
		}
		const emitter = ({ localIO, socketsToSendTo }: ChainEmmiter, cleared: boolean ): void=>{
			if(socketsToSendTo){
				localIO.emit('unread-cleared', { cleared: cleared });
			}
		}
		const deleteCache = (): void =>{
			const msgRedisKeyRRecent = `lstActiveConvo-username:${sender}`;
			const msgRedisKeySRecent = `lstActiveConvo-username:${receiver}`;
			try{
				redisClient.get(msgRedisKeyRRecent, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRRecent)}
				});
				redisClient.get(msgRedisKeySRecent, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeySRecent)}
				});
			}catch(err){}
		}
		UserModel.findOne({ username: sender })
			.exec()
			.then(async (user: UserWithSave)=>{
				if(!user){ return res.statusJson(401, { data: { success: false, message: 'Not found' } }); }
				for(let i = 0; i < user.conversations.length; i++){
					if(user.conversations[i].withWho === receiver){
						user.conversations[i].unreadMsgs = 0;
					}
				}
				const result = await user.save();
				let data = { success: false };
				if(result){
					data.success = true;
				}
				emitter(
					chainIO({ 
						localIO: io,
						socketsToSendTo: false
					}),
					data.success
				);
				deleteCache();
				return res.statusJson(200, { data: data });					
			}).catch(err=>{
				const data = { err: err, success: false };
				return res.statusJson(500, { data: data });
			})
	}

	@del('/message/:messageId')
	deleteMessage(req: RequestWithParams, res: Response){
		const { messageId } = req.params;
		Message.findByIdAndRemove(messageId, {}, (err, msgDeleted: Msg)=>{
					const data = { msgDeleted: msgDeleted, success: true };
					if(err){
						const data = { err: err, success: false };
						return res.statusJson(500, { data: data });
					}
					//console.log(msgDeleted);
					//i changed the structure of this map thats why im getting error

					let localIO = io;
					let socketsToSendTo = false;
				    sids.forEach((usernames: Usernames, id: string)=>{
				      if( (usernames.receiver === msgDeleted.receiver && usernames.sender === msgDeleted.sender) || (usernames.receiver === msgDeleted.sender && usernames.sender === msgDeleted.receiver) ) {
				      	socketsToSendTo = true;
				      	//chain rooms based on the users id
				      	localIO = localIO.to(id);
				      }
				    });
				    if(socketsToSendTo){
						//emit only to the sender and the receiver so they both
						//can register it on their respoective screens.
						localIO.emit('delete-msg', data);
				    }

					return res.statusJson(200, { data: data });
				});
	}

	@del('/messages')
	deleteMessages(req: Request, res: Response){
		Message.deleteMany().exec().then(info=>{
			const data = { info: info, success: true };
			return res.statusJson(200, { data: data });
		}).catch(err=>{
			const data = { err: err, success: false };
			return res.statusJson(500, { data: data });
		});
	}
	/**
	*add type of message
	@get('/messages/reset')
	resetMessages(req: Request, res: Response){
		Message.find({})
				.exec()
				.then(async (messages: MsgWithSave[])=>{
					if(!messages){
						return res.statusJson(404, { data: { message: 'Empty' } });
					}
					enum MsgTypeEnum {
						text = 'text',
						img = 'img',
						otherfile = 'otherfile'
					}
					for(let i = 0; i < messages.length; i++){
						try{
							messages[i].typeOfMsg = MsgTypeEnum['text'];
							messages[i] = await messages[i].save();
						}
						catch(err){
							const data = { err: err };
							if(err){ return res.statusJson(501, { data: data }); }
						}
					}
					return res.statusJson(200, { data: messages });
				})
				.catch(err=>{
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				});
	}*/

	/*@get('/messages/reset')
	resetMessages(req: Request, res: Response){}*/

	@get('/users/conversations/reset')
	resetUsersConversations(req: Request, res: Response){
		UserModel.find()
				.exec()
				.then(async (users: UserWithSave[]): Promise<any>=>{
					if(users.length < 1){
						return res.statusJson(401, { data: { message: 'Not found' } });
					}
					for(let i = 0; i < users.length; i++){
						try{
							users[i].conversations = [];
							users[i] = await users[i].save();
						}
						catch(err){
							const data = { err: err };
							if(err){ return res.statusJson(500, { data: data }); }
						}						
					}
					return res.statusJson(200, { data: { message: 'Done' } });
				})
				.catch(err=>{
					throw new Error(err);
				});
	}
}