import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminCategoriesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.serviceCategory.findMany();
  }

  create(name: string) {
    return this.prisma.serviceCategory.create({
      data: { name },
    });
  }

  deactivate(id: string) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
