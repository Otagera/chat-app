export interface IMsg extends Usernames{
	_id: number;
	message: string;
	timeSent: Date;
	typeOfMsg: MsgTypeEnum;
	fileURL?: string;
	fileSize?: number;
}
enum MsgTypeEnum {
	text = 'text',
	img = 'img',
	otherfile = 'otherfile'
}
export interface Usernames{
	sender: string;
	receiver: string;
}
export interface StatusInfo {
	id: string;
}
export interface Typings {
	usernames: Usernames
	typing: boolean;
}
export interface RegisterMessenger {
	usernames: Usernames
	socketId: string;
}
export interface RegisterInfo {
	username: string;
	socketId: string;
}
export interface OnlineInfo{
  online: boolean;
  username: string;
}
export interface StorageUser {
	username: string;
	token: string;
}
