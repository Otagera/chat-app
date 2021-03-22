import { Response, NextFunction } from 'express';
import { RequestWithDecoded } from '../interfaces';
import jwt from 'jsonwebtoken';

export const chatAuth = (req: RequestWithDecoded, res: Response, next: NextFunction)=>{
	try {
		//req.headers['x-access-token'] || req.headers.authorization;
		let t = req.headers['x-access-token'];
		let token = req.headers.authorization;
		if(token && token.startsWith('Bearer ')){
			token = token.split(' ')[1];
		}
		const decoded = jwt.verify(token, process.env.JWT_KEY);
		//console.log(decoded);
		req.decoded = decoded;
		next();
	} catch(e) {
		console.log(e);
		return res.statusJson(401, { message: 'Auth failed' });
	}
}