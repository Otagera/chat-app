import mongoose, { Document } from 'mongoose';

export interface Group{
	name: string;
	description: string;
	users: { username: string }[];
	creator: string;
	admins: { username: string }[];
}

export interface GroupWithId extends Group{
	_id: number;
}
export interface GroupBaseDocument extends Group, Document{}

export interface GroupWithSave extends Group{
	save(options?: mongoose.SaveOptions): Promise<GroupBaseDocument>;
}