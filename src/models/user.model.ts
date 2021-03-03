import mongoose, { Schema, Document } from 'mongoose';
import { UserBaseDocument } from '../interfaces';


mongoose.set('useCreateIndex', true);


const userSchema: Schema = new Schema({
	username: 		{ type: String, required: true, unique: true, trim: true },
	password: 		{ type: String, required: true },
	conversations:	[{ 
						withWho: { type: String },
						unreadMsgs: { type: Number, default: 0 }
					}]
});

mongoose.model<UserBaseDocument>('User', userSchema);