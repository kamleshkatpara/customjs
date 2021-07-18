import { Todo } from './todo.interface';
import { Schema, model } from 'mongoose';

export const TodoSchema = new Schema({
    name: String,
    description: String
});

export default model<Todo>('Todo', TodoSchema);