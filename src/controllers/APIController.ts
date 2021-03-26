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
	Group,
	GroupWithSave,
	ChainEmmiter,
	RequestWithBody,
	RequestWithParams
} from '../interfaces';
import { upload, chatAuth, clearUploads } from '../middlewares';

import { sids, onlines } from '../app';

const Message = mongoose.model('Message');
const UserModel = mongoose.model('User');
const GroupModel = mongoose.model('Group');

const cryptr = new Cryptr(process.env.CRYPTR_KEY);

const testm = (req, res, next)=>{
	console.log('testm');
	next();
}
const testt = (req, res, next)=>{
	console.log('testt', req.body);
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
	@use(upload.single('fileURL'))
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
	    	fileSize: (file)? file.size: 0,
		};
		//return res.statusJson(200, { data: { msg: message } });

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
		const emitter = ({ localIO, socketsToSendTo }: ChainEmmiter, dataToSend: { [key: string]: string | Date | boolean | number} ): void=>{
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
			const msgRedisKeySAttach = `attachmentMsgs-username:${sender}`;
			const msgRedisKeyRAttach = `attachmentMsgs-username:${receiver}`;
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
				redisClient.get(msgRedisKeySAttach, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeySAttach)}
				});
				redisClient.get(msgRedisKeyRAttach, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRAttach)}
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
					read: newMsg.read,
					typeOfMsg: newMsg['typeOfMsg'],
			    	fileURL: newMsg['fileURL'],
			    	fileSize: newMsg['fileSize'],
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

	@post('/group/new')
	@bodyValidator('name', 'creator', 'description')
	createGroup(req: RequestWithBody, res: Response){
		const { name, creator, description } = req.body;
		const group: Group = {
			name: name,
			description: description,
			creator: creator,
			users: [{ 'username': creator }],
			admins: [{ 'username': creator }]
		}

		GroupModel.find({ name: name.toLowerCase() })
			.exec()
			.then((groups: Group[])=>{ 
				if(groups.length >= 1){
					const data = {
						message: 'Sorry group name already exists.'
					}
					return res.statusJson(500, { data: data });
				}
				GroupModel.create(group).then((newGroup) => {
					const data = {
						message: 'Group created',
						success: true,
						group: newGroup
					}
					return res.statusJson(200, { data: data });
				}).catch(err=>{
					const data = {
						err: err,
						success: false
					}
					return res.statusJson(500, { data: data });
				});
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@post('/group/add-user/:groupname')
	@bodyValidator('username')
	addUserToGroup(req: RequestWithBody, res: Response){
		const { username } = req.body;
		const { groupname } = req.params;
		GroupModel.findOne({ name: groupname.toLowerCase() })
			.exec()
			.then(async (group: GroupWithSave)=>{
				if(!group){
					const data = {
						message: 'Sorry Group does not exist, check the groupname again.'
					}
					return res.statusJson(401, { data: data });
				}
				const userExist = group.users.some(user=>{
					return user.username !== username.toLowerCase();
				});
				if(!userExist){
					const data = {
						success: false,
						message: `Sorry the user:${username} already in the group.`
					}
					return res.statusJson(200, { data: data });					
				}
				try{
					group.users.push({ username: username.toLowerCase() });
					await group.save();
					const data = {
						success: true
					};
					return res.statusJson(200, { data: data });
				}catch(err){
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				}
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@post('/group/remove-user/:groupname')
	@bodyValidator('username')
	removeUserToGroup(req: RequestWithBody, res: Response){
		const { username } = req.body;
		const { groupname } = req.params;
		GroupModel.findOne({ name: groupname.toLowerCase() })
			.exec()
			.then(async (group: GroupWithSave)=>{
				if(!group){
					const data = {
						message: 'Sorry Group does not exist, check the groupname again.'
					}
					return res.statusJson(401, { data: data });
				}
				try{
					group.users = group.users.filter(user=>{
						return user.username !== username.toLowerCase();
					});
					group.admins = group.admins.filter(admin=>{
						return admin.username !== username.toLowerCase();
					});
					await group.save();
					const data = {
						success: true
					};
					return res.statusJson(200, { data: data });
				}catch(err){
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				}
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@post('/group/add-admin/:groupname')
	@bodyValidator('username')
	addAdminToGroup(req: RequestWithBody, res: Response){
		const { username } = req.body;
		const { groupname } = req.params;
		GroupModel.findOne({ name: groupname.toLowerCase() })
			.exec()
			.then(async (group: GroupWithSave)=>{
				if(!group){
					const data = {
						message: 'Sorry Group does not exist, check the groupname again.'
					}
					return res.statusJson(401, { data: data });
				}
				const userExist = group.users.some(user=>{
					return user.username !== username.toLowerCase();
				});
				if(!userExist){
					const data = {
						success: false,
						message: `Sorry the user:${username} is not in this group, thus cannot be an admin.`
					}
					return res.statusJson(200, { data: data });					
				}
				const adminExists = group.admins.some(admin=>{
					return admin.username !== username.toLowerCase();
				})
				if(!adminExists){
					const data = {
						success: false,
						message: `Sorry the user:${username} is already an admin.`
					}
					return res.statusJson(200, { data: data });
				}
				try{
					group.admins.push({ username: username.toLowerCase() });
					await group.save();
					const data = { success: true };
					return res.statusJson(200, { data: data });
				}catch(err){
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				}
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@post('/group/remove-admin/:groupname')
	@bodyValidator('username')
	removeAdminToGroup(req: RequestWithBody, res: Response){
		const { username } = req.body;
		const { groupname } = req.params;
		GroupModel.findOne({ name: groupname.toLowerCase() })
			.exec()
			.then(async (group: GroupWithSave)=>{
				if(!group){
					const data = {
						message: 'Sorry Group does not exist, check the groupname again.'
					}
					return res.statusJson(401, { data: data });
				}
				try{
					group.admins = group.admins.filter(admin=>{
						return admin.username !== username.toLowerCase();
					});
					await group.save();
					const data = { success: true };
					return res.statusJson(200, { data: data });
				}catch(err){
					const data = { err: err };
					if(err){ return res.statusJson(500, { data: data }); }
				}
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@get('/group/messages/all/:groupname')
	getGroupMessages(req: Request, res: Response){
		const { groupname } = req.params;
		const msgRedisKey = `msgs-group:${groupname.toLowerCase()}`;
		const findMesage = ()=>{
			Message.find({'receiver': groupname.toLowerCase()})
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

	@get('/group/details/:groupname')
	getGroupDetails(req: Request, res: Response){
		const { groupname } = req.params;
		GroupModel.findOne({ name: groupname.toLowerCase() })
			.exec()
			.then((group: Group)=>{
				const data = {
					group: group,
					success: true
				};
				res.statusJson(200, { data: data });
			})
			.catch(err=>{
				const data = {
					err: err,
					success: false
				}
				return res.statusJson(500, { data: data });
			});
	}

	@post('/group/message')
	@use(upload.single('fileURL'))
	@bodyValidator('msg', 'sender', 'receiver', 'typeOfMsg')
	sendGroupMessage(req: RequestWithBody, res: Response){
		const { file, body } = req;
		const { msg, sender, receiver, typeOfMsg } = body;

		enum MsgTypeEnum {
			text = 'text',
			img = 'img',
			otherfile = 'otherfile'
		}
		const message: Msg = {
			message: cryptr.encrypt(msg),
			sender: sender,
			receiver: receiver,
			read: false,
			typeOfMsg: MsgTypeEnum[typeOfMsg],
	    	fileURL: (file)? file.path: '',
	    	fileSize: (file)? file.size: 0,
		};
		const deleteCache = (): void =>{
			const msgRedisKey = `msgs-group:${receiver}`;
			const msgRedisKeyRecent = `lstActiveConvo-group:${receiver}`;
			const msgRedisKeyAttach = `attachmentMsgs-group:${receiver}`;
			try{
				redisClient.get(msgRedisKey, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKey)}
				});
				redisClient.get(msgRedisKeyRecent, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRecent)}
				});
				redisClient.get(msgRedisKeyAttach, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyAttach)}
				});
			}catch(err){}
		}
		Message.create(message).then((newMsg: Msg) => {
			//emit only to the sender and the receiver so they both
			//can register it on their respoective screens.
			deleteCache();
			io.to(receiver).emit('send-msg', 
				{
					message: cryptr.decrypt(newMsg['message']),
					timeSent: newMsg['timeSent'],
					sender: newMsg['sender'],
					receiver: newMsg['receiver'],
					read: newMsg.read,
					typeOfMsg: newMsg['typeOfMsg'],
			    	fileURL: newMsg['fileURL'],
			    	fileSize: newMsg['fileSize'],
					_id: newMsg['_id'],
				}
			);			
			const data = { success: true };
			return res.statusJson(200, { data: data });
		}).catch(err=>{
			const data = { err: err, success: false };
			return res.statusJson(500, { data: data });
		});
	}

	@get('/groups/:username')
	getAllGroupsUserBelongsTo(req: Request, res: Response){
		const { username } = req.params;

		GroupModel.find({'users': { $elemMatch: { username: username.toLowerCase() }}})
			.exec()
			.then((groups: Group[])=>{
				const data = { groups: groups };
				return res.statusJson(200, { data: data });
			}).catch(err=>{
				const data = { err: err, success: false };
				return res.statusJson(500, { data: data });
			})
	}

	@get('/messages/recent/:username')
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

	@get('/messages/attachment/:username')
	getFilesMessages(req: Request, res: Response){
		const { username } = req.params;
		enum MsgTypeEnum {
			text = 'text',
			img = 'img',
			otherfile = 'otherfile'
		}
		const msgRedisKey = `attachmentMsgs-username:${username}`;
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
					Message.find({ $and: [
											{ $or: [
												{'sender': username },
												{'receiver': username }
												] 
											},
											{ 'typeOfMsg': { $in: [MsgTypeEnum.otherfile, MsgTypeEnum.img]} }
										 ]
								})
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
								res.statusJson(200, { data: data });
							}).catch(err=>{
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
		const deleteCache = (sender: string, receiver: string): void =>{
			const msgRedisKeySR = `msgs-sender:${sender}-receiver:${receiver}`;
			const msgRedisKeyRS = `msgs-sender:${receiver}-receiver:${sender}`;
			try{
				redisClient.get(msgRedisKeySR, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeySR)}
				});
				redisClient.get(msgRedisKeyRS, async (err, messages)=>{
					if(err || messages){redisClient.del(msgRedisKeyRS)}
				});
			}catch(err){}
		}
		Message.findByIdAndRemove(messageId, {}, (err, msgDeleted: Msg)=>{
					const data = { msgDeleted: msgDeleted, success: true };
					if(err){
						const data = { err: err, success: false };
						return res.statusJson(500, { data: data });
					}
					if(msgDeleted){
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
					    deleteCache(msgDeleted.sender, msgDeleted.receiver);
						return res.statusJson(200, { data: data });
					}else{
						const data = { err: err, success: false };
						return res.statusJson(501, { data: data });
					}
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