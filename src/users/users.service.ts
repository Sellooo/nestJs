import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/users.entity';
import * as bcrypt from 'bcryptjs';
import { ConflictException, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<void> {
        const { user_id, password, nickname, phone } = createUserDto;

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt); //비밀번호 암호화 bcrypt 모듈

        const user = this.userRepository.create({ user_id, password: hashedPassword, nickname, phone });

        try {
            await this.userRepository.save(user);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('유저이름이 이미 있습니다.');
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    async getAllUsers(): Promise<UserEntity[]> {
        return this.userRepository.find();    //유저가져오기
    }

    async signIn(createUserDto: CreateUserDto): Promise<string> {
        const { user_id, password } = createUserDto;
        const user = await this.userRepository.findOneBy({ user_id });

        if (user && (await bcrypt.compare(password, user.password))) {
            return '로그인 성공';
        } else {
            throw new UnauthorizedException('로그인 실패');
        }
    }
}