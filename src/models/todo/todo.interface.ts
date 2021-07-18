import { Document } from 'mongoose';

export interface Todo extends Document {
    readonly _id: string;
    readonly name: string;
    readonly description: string;
}