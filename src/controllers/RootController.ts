import { Request, Response } from 'express';
import { get, controller } from './decorators/index';


@controller('')
class RootController {
	@get('/')
	getRootPage(req: Request, res: Response){
		res.render('index', { title: 'Chat App' });
	}
	@get('/chatrooms')
	getChatRoomsPage(req: Request, res: Response){
		res.render('chatroom', { title: 'Chat App' });
	}
	@get('/chatroom/:receiver')
	getChatRoomPage(req: Request, res: Response){
		res.render('chatroom', { title: 'Chat App' });
	}
	@get('/auth/login')
	getLoginPage(req: Request, res: Response){
		res.render('login', { title: 'Chat App' });
	}
	@get('/auth/signup')
	getSignupPage(req: Request, res: Response){
		res.render('signup', { title: 'Chat App' });
	}
}