import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminCategoriesService } from './admin-categories.service';

@Roles(Role.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private service: AdminCategoriesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
