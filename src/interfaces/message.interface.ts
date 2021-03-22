import mongoose, { Document } from 'mongoose';
export interface Msg{
	message: string;
	timeSent?: Date;
	sender: string;
	receiver: string;
	read?: boolean;
	typeOfMsg: MsgTypeEnum;
	fileURL?: string;
}
export enum MsgTypeEnum {
	text = 'text',
	img = 'img',
	otherfile = 'otherfile'
}
export interface MsgBaseDocument extends Msg, Document {}
export interface MsgWithSave extends Msg{
	save(options?: mongoose.SaveOptions): Promise<MsgBaseDocument>;
}
