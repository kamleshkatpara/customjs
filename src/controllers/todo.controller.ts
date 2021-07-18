import { Todo } from './../models/todo/todoDto';
import { TodoService } from '../services/todo.service';
import { JsonController, Get, Post, Body } from "routing-controllers";

@JsonController('/todos')
export class TodoController {

    constructor(private readonly todoService: TodoService) { }

    @Get()
    async findAll(): Promise<Todo[]> {
        return await this.todoService.findAll();
    }

    @Post()
    async create(@Body() todo: Todo) {
        return todo;
    }
}