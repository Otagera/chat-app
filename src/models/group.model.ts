import mongoose, { Schema, Document } from 'mongoose';
import { GroupBaseDocument } from '../interfaces';

mongoose.set('useCreateIndex', true);

const groupSchema: Schema = new Schema({
	name:		{ type: String, required: true, unique: true, trim: true },
	description:{ type: String },
	users:		[{ username: { type: String } }],
	creator: 	{ type: String, required: true, unique: true, trim: true },
	admins: 	[{ username: { type: String } }],
})

mongoose.model<GroupBaseDocument>('Group', groupSchema);