import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { MsgBaseDocument } from '../interfaces';

mongoose.set('useCreateIndex', true);

const msgSchema: Schema = new Schema({
	message: 	{ type: String, required: true },
	timeSent: 	{ type: Date, default: Date.now },
	sender: 	{ type: String, required: true },
	receiver: 	{ type: String, required: true },
	read: 		{ type: Boolean, default: false }
});

mongoose.plugin(mongoosePaginate);

mongoose.model<MsgBaseDocument>('Message', msgSchema);