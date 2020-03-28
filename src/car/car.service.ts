import { Position, BBox } from "geojson";
import { InsertResult, Raw, SelectQueryBuilder } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Car } from "./car.entity";
import { CarRepository } from "./car.repository";
import { AddCarDto } from "./dto/create-car.dto";
import { SortbyDto } from "./dto/selection.dto";

export type CarFilter = Partial<Pick<Car, "carType" | "carModel" | "capacity">>
export type CarAvailabilityFilter = {
  duration?: [Date, Date],
  pickupArea?: [Position, Position],
}


@Injectable()
export class CarService {

  constructor(
    @InjectRepository(Car)
    private readonly carRepository: CarRepository,
  ) { }

  async findAll(
    where: CarFilter,
    sortBy: SortbyDto,
  ): Promise<Car[]> {
    return this.carRepository.find(
      {
        relations: ["owner"],
        where,
        order: (sortBy != undefined) ? { [sortBy.sortby]: sortBy.orderby } : undefined
      }
    );
  }

  async findAllAvailable(
    whichCar?: CarFilter,
    whichAvailableOn?: CarAvailabilityFilter,
    sortBy?: SortbyDto,
  ): Promise<Car[]> {
    return this.carRepository.find({
      join: { alias: 'cars', innerJoinAndSelect: { availability: 'cars.availability' } },
      order: (sortBy != undefined) ? ({ [sortBy.sortby]: sortBy.orderby }) : undefined,
      where:
        (qb: SelectQueryBuilder<Car>) => {
          if (whichCar != undefined) {
            qb.where(whichCar)

          }

          if (whichAvailableOn != undefined) {

            if (whichAvailableOn.pickupArea != undefined) {
              qb.andWhere(
                'availability.pickup_location <@ :pickupLocation::box',
                {
                  'pickupLocation': this.bboxToValue([
                    whichAvailableOn.pickupArea[0][0],
                    whichAvailableOn.pickupArea[0][1],
                    whichAvailableOn.pickupArea[1][0],
                    whichAvailableOn.pickupArea[1][1],
                  ])
                })
            }

            if (whichAvailableOn.duration != undefined) {
              qb.andWhere(
                'availability.start_date < :time1::timestamp',
                { time1: whichAvailableOn.duration[0].toISOString() }
              ).andWhere(
                'availability.end_date < :time2::timestamp',
                { time2: whichAvailableOn.duration[1].toISOString() }
              )
            }

          }
        }
    });
  }

  private bboxToValue(bbox: BBox) {
    return `((${bbox.slice(0, 2).join(",")}),(${bbox.slice(2, 4).join(",")}))`;
  }

  async add(ownerId: number, dto: AddCarDto): Promise<InsertResult> {
    const newCar: Car = {
      ...dto,
      avgRating: 0,
      owner: null,
      carId: null,
      ownerId,
    }
    return this.carRepository.insert(newCar)
  }
}