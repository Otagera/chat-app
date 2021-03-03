export interface IMsg extends Usernames{
	_id: number;
	message: string;
	timeSent: Date;
}
export interface Usernames{
	sender: string;
	receiver: string;
}
export interface StatusInfo {
	id: string;
}
export interface RegisterInfo {
	usernames: Usernames
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
