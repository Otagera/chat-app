import mongoose, { Document } from 'mongoose';
export interface Msg{
	message: string;
	timeSent?: Date;
	sender: string;
	receiver: string;
	read?: boolean;
}
export interface MsgBaseDocument extends Msg, Document {}
export interface MsgWithSave extends Msg{
	save(options?: mongoose.SaveOptions): Promise<MsgBaseDocument>;
}
