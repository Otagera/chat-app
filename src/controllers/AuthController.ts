import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get, post, bodyValidator, controller } from './decorators/index';
import { io } from '../app';
import mongoose from 'mongoose';
import { UserWithId, User, RequestWithBody } from '../interfaces';

import { sids, onlines } from '../app';

const UserModel = mongoose.model('User');

@controller('/auth')
class AuthController {
	@post('/login')
	@bodyValidator('username', 'password')
	userLogin(req: RequestWithBody, res: Response){
		const { username, password } = req.body;
		const dataF = {
			message: 'Auth failed!'
		}
		UserModel.find({ username: username.toLowerCase() })
			.exec()
			.then((users: UserWithId[])=>{ 
				if(users.length < 1){
					return res.statusJson(401, { data: dataF });
				}
				bcrypt.compare(password, users[0].password, (err, result)=>{
					if(err){ return res.statusJson(401, { data: dataF }); }
					if(result){
						const token = jwt.sign(
							{
								username: users[0].username,
								userId: users[0]._id
							},
							process.env.JWT_KEY,
							{
								expiresIn: '48h'
							}
						);
						const data = {
							message: 'Auth Successful',
							token: token,
							username: users[0].username,
						}
						return res.statusJson(200, { data: data });
					}
					return res.statusJson(402, { data: dataF });
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

	@post('/signup')
	@bodyValidator('username', 'password')
	userSignup(req: RequestWithBody, res: Response){
		const { username, password } = req.body;
		UserModel
			.find({ username: username.toLowerCase() })
			.exec()
			.then((users: User[])=>{
				if(users.length >= 1){
					const data = { 
						message: 'Sorry this username has already been taken'
					};
					return res.statusJson(409, { data: data });
				}else {
					bcrypt.hash(password, 10, (err, hash)=>{
						if(err){ 
							return res.statusJson(500, { 
								data: {
									err: err
								}
							});
						}else{
							const user: User = {
								username: username.toLowerCase(),
								password: hash,
								conversations: []
							};
							UserModel.create(user).then((newUser) => {
								const data = {
									message: 'User created',
									success: true,
									user: newUser
								}
								return res.statusJson(200, { data: data });
							}).catch(err=>{
								const data = {
									err: err,
									success: false
								}
								return res.statusJson(500, { data: data });
							});							
						}
					});
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

	@get('/status/:username')
	checkUserOnlineStatus(req: Request, res: Response): void{
		const { username } = req.params;
		const data = {
			status: false,
		};
		for(let [id, onlineInfo] of onlines){
			if(onlineInfo.username === username){
				data.status = onlineInfo.online;
				continue;
			}
		}
		/*
	    for(let usernames of sids.values()){
	      if(usernames.sender === username) {
			data.status = true;
			continue;
	      }
    	}
    	*/
		return res.statusJson(200, { data: data });
	}

	@get('/exist/:username')
	checkUserExistence(req: Request, res: Response): void{		
		const { username } = req.params;
		let data = { status: false, };
		UserModel.findOne({ 'username': username })
				.exec()
				.then((user: User)=>{
					if(!user){
						return res.statusJson(203, { data: data });
					}
					data.status = true;
					return res.statusJson(200, { data: data });
				}).catch(err=>{
					data['err'] = err;
					if(err){ return res.statusJson(500, { data: data }); }
				});
	}
}