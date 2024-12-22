import { Request, Response } from "express";
import {  Like } from 'typeorm';
import bcrypt from 'bcrypt'

import * as jwt from "../jwt"
import { Patient, RefreshToken } from "../models";
import { RefreshTokenRepository, PatientsRepository } from "../repositories";
import { refreshTokenExpiresIn } from "../refreshTokenExpiration";
import { PatientAlreadyExistsError } from "../errors/patient.errors";
import { HttpError } from "src/common/app.errors";
import { GeneralInternalError } from "src/errors/unknown.errors";

class PatientController{
  
  async create(request: Request, response: Response){
    const body = request.body;
    

    const patientAlreadyExists = await PatientsRepository.findOne({ 
      where: [
        { CPF: body.CPF }, 
        { email: body.email }
      ] 
    })

    if(patientAlreadyExists){
      throw new PatientAlreadyExistsError();
    }

    body.status = "Saudável"
    body.createdAt = new Date()
    body.lastUpdate = body.createdAt

    try {
      const patientBody = PatientsRepository.create(body)
      const patient: any = await PatientsRepository.save(patientBody)
      const patientId = patient.id
      

      const refreshTokenBody = RefreshTokenRepository.create({
        patientId,
        expiresIn: refreshTokenExpiresIn()
      })

      const refreshToken = await RefreshTokenRepository.save(refreshTokenBody)

      const token = jwt.sign({
          id: patient.id,
          type: 'patient'
      })

      patient.password = undefined
      return response.status(201).json({ 
        success: "Paciente criado com sucesso",
        patient, 
        token, 
        refreshToken 
      })
    } catch (error) {
      if (error instanceof HttpError) {
        return response.status(error.httpCode).json({
          apiContext: error.apiContext,
          httpCode: error.httpCode,
          message: error.message,
          externalServiceError: error.externalServiceError
        })
      }

      const unknownError = new GeneralInternalError();

      return response.status(unknownError.httpCode).json({
        apiContext: unknownError.apiContext,
        httpCode: unknownError.httpCode,
        message: unknownError.message,
        externalServiceError: unknownError.externalServiceError
      })
    }
  }

  async loginPost(request: Request, response: Response){
    const { CPF, password } = request.body

    
    if(!password) {
      return response.status(401).json({
        error: "Senha não informada"
      })
    }
    
    const patientExists: any = await PatientsRepository.findOne({
      where: { CPF }, 
      select: ['id', 'CPF', 'password']
    })

    if (!patientExists) {
      return response.status(401).json({
        error: "Email e/ou senha inválidos"
      })
    }

    
    const validPassword = await bcrypt.compare(password, patientExists.password)

    if(validPassword) {
      try {
        const patientId = patientExists.id

        const token = jwt.sign({
          id: patientId,
          type: 'patient'
        })
  
  
        const refreshTokenExists = await RefreshTokenRepository.findOne({
          where: {patientId : patientId}
        })
        
        if(refreshTokenExists) {
          await RefreshTokenRepository.createQueryBuilder()
          .delete()
          .from(RefreshToken)
          .where("patientId = :id", { id: patientId })
          .execute()
        }
  
        const refreshTokenBody = RefreshTokenRepository.create({
          patientId,
          expiresIn: refreshTokenExpiresIn()
        })
  
        const refreshToken = await RefreshTokenRepository.save(refreshTokenBody)
        const patient = await PatientsRepository.findOne({where: {CPF}})

        refreshToken.patientId = undefined
        patient.password = undefined
  
        return response.status(200).json({ patient, token, refreshToken })
      } catch (error) {
        console.log(error);
        return response.status(400).json({
          error: "Erro no login"
        })
      }
    } else {
      return response.status(401).json({
        error: "Email e/ou senha inválidos"
      })
    }
  }

  async list(request: Request, response: Response){
    const { 
      id, 
      name,
      cpf,
      gender,
      neighborhood,
      status, 
      active, 
      page } = request.query
    let filters = {}


    if(id) {
      filters = { ...filters, id: String(id) }

      const patient = await PatientsRepository.findOne({
        where: {id: String(id)}
      })
    
      if(!patient){
        return response.status(404).json({
          error: "Paciente não encontrado"
        })
      }
    }

    if(status) {
      filters = { ...filters, status: Like(`%${String(status).toUpperCase()}%`)}
    }

    if(active) {     
      if(active === "true") {
        filters = { ...filters, activeAccount: true }
      } else {
        filters = { ...filters, activeAccount: false }
      }
    }   

    if(name) {
      filters = { ...filters, name: Like(`%${String(name)}%`)}
    }

    if(cpf) {
      filters = { ...filters, CPF: Like(`%${String(cpf)}%`)}
    }

    if(gender) {
      filters = { ...filters, gender: Like(`%${String(gender)}%`)}
    }

    if(neighborhood) {
      filters = { ...filters, neighborhood: Like(`%${String(neighborhood)}%`)}
    }

    let options: any = {
      where: filters,
      order: {
        createdAt: 'DESC'
      },
    }

    if(page) {
      const take = 10
      options = { ...options, take, skip: ((Number(page) - 1) * take) }
    }
    
    const patientsList = await PatientsRepository.findAndCount(options)
    return response.json({
      patients: patientsList[0],
      totalPatients: patientsList[1]
    })
  } 

  async getOneWithToken(request, response: Response) {
    const { id, type } = request.tokenPayload

    if(type !== 'patient') {
      return response.status(401).json({
        error: "Token inválido para essa requisição"
      })
    }
    
    const user = await PatientsRepository.findOne({ where:{id:id} })

    if(!user) {
      return response.status(401).json({
        error: "Paciente inválido"
      })
    }
    
    return response.status(200).json(user)
  }

  async alterOne(request: Request, response: Response){
    const body = request.body
    const { id } = request.params


    
    const patient = await PatientsRepository.findOne({ where: {id : id} })
      
    if(!patient){
      return response.status(404).json({
        error: "Paciente não encontrado"
      })
    }

    if(body.password){
      const hash = await bcrypt.hash(body.password, 10)
      body.password = hash
    }

    try {
      await PatientsRepository.createQueryBuilder()
        .update(Patient)
        .set(body)
        .where("id = :id", { id })
        .execute();
      return response.status(200).json({
        success: "Paciente atualizado com sucesso"
      })
    } catch (error) {
      return response.status(403).json({
        error: "Erro na atualização do paciente"
      })
    }
  }

  async deleteOne(request: Request, response: Response){
    const { id } = request.params


    const patient = await PatientsRepository.findOne({ where: {id: id} })
    
    if(!patient){
      return response.status(404).json({
        error: "Paciente não encontrado"
      })
    }

    try {
      await PatientsRepository.createQueryBuilder()
        .delete()
        .from(Patient)
        .where("id = :id", { id })
        .execute();
      return response.status(200).json({
        success: "Paciente deletado com sucesso"
      })
    } catch (error) {
      return response.status(403).json({
        error: "Erro na deleção do paciente"
      })
    }
  }

  async deactivateAccount(request: Request, response: Response){
    const { id } = request.params


    const patient = await PatientsRepository.findOne({ where: {id : id} })
    
    if(!patient){
      return response.status(404).json({
        error: "Paciente não encontrado"
      })
    }

    try {
      await PatientsRepository.createQueryBuilder()
        .update(Patient)
        .set({ activeAccount: false })
        .where("id = :id", { id })
        .execute()
      return response.status(200).json({
        success: "Conta desativada com sucesso"
      })
    } catch (error) {
      return response.status(403).json({
        error: "Erro na desativação da conta"
      })
    }
  }
}

export { PatientController }