import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { IsAllowedGuard } from '@prici/sdk/nest';

const featureId = process.env.TODOS_FEATURE_ID as string;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('todos')
  getAllTodos() {
    return this.appService.getAllTodos();
  }

  @Post('todos')
  @UseGuards(
    IsAllowedGuard({
      getAccountId: (_) => 'demo-account',
      getFieldId: (_) => featureId,
    }),
  )
  createTodo(@Body() body: any) {
    return this.appService.createTodo(body);
  }
}
