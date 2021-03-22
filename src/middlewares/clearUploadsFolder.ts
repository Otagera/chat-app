import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const directory = path.join(__dirname, '../../uploads');

export const clearUploads = (req: Request, res: Response, next: NextFunction)=>{
	if(process.env.NODE_ENV === 'production'){
		next();
	}else{
		fs.readdir(directory, (err, files)=>{
			if(err) throw err;
			for(const file of files){
				fs.unlink(path.join(directory, file), err=>{
					if(err) throw err;
				});
			}
		});
		next();
	}
}