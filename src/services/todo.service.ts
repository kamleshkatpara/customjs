import { Todo } from "../models/todo/todo.interface";
import todoModel from '../models/todo/todo.schema';

export class TodoService {

    async findAll(): Promise<Todo[]> {
        return await todoModel.find().exec();
    }

    async create(todo: Todo): Promise<Todo> {
        const createdTodo = new todoModel(todo);
        return await createdTodo.save();
    }
}