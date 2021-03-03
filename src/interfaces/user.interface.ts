import mongoose, { Document } from 'mongoose';
interface Conversation{
	withWho: string;
	unreadMsgs: number;
}
export interface User {
	username: string;
	password: string;
	conversations: Conversation[];
}
export interface UserWithId extends User{
	_id: number;
}
export interface UserBaseDocument extends User, Document{}

export interface UserWithSave extends User{
	save(options?: mongoose.SaveOptions): Promise<UserBaseDocument>;
}