import { IsString, MinLength, MaxLength } from "class-validator";

export class Todo {
    @IsString()
    public _id: string;

    @IsString()
    @MinLength(3)
    public name: string;

    @IsString()
    @MinLength(3)
    @MaxLength(50, { message: 'Language name is too long' })
    public description: string;
}