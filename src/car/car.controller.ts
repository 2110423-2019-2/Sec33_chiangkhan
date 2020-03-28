import {
  Controller,
  UseGuards,
  UseInterceptors,
  Get,
  Post,
  Body,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsertResult } from 'typeorm';

import { UserInterceptor } from 'src/interceptor/user.interceptor';
import { ParseArrayPipe } from 'src/common/array.pipe';
import { AddCarDto } from './dto/create-car.dto';
import { SelectionDto } from './dto/selection.dto';
import { ParseSortByPipe } from './sortby.pipe';
import { Car } from './car.entity';
import { CarService } from './car.service';


@Controller('car')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(UserInterceptor)
export class CarController {
  constructor(
    private readonly carService: CarService,
  ) { }

  @Get()
  @UsePipes(
    new ParseArrayPipe<SelectionDto>({
      duration: (x) => new Date(x),
      pickupArea: Object
    }),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      }
    }),
    new ParseSortByPipe(),
  )
  getAllCars(
    @Query() query: SelectionDto,
  ): Promise<Car[]> {
    const { _sortby, duration, pickupArea, ...filter } = query
    return this.carService.findAllAvailable(
      filter,
      { duration, pickupArea },
      _sortby
    );
  }

  @Post()
  addUserCar(
    @Body('_user') user: number,
    @Body(new ValidationPipe()) dto: AddCarDto
  ): Promise<InsertResult> {
    return this.carService.add(user, dto)
  }

  @Get('test')
  async test(
  ) {
    return this.carService.findAllAvailable({
      capacity: 2
    })
  }
}
