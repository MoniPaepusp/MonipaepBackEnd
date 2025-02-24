import { Request, Response } from "express";
import { In, IsNull, Repository } from "typeorm";

import { DiseaseOccurrence, Patient, Symptom, SymptomOccurrence } from "../models";
import { AppDataSource } from "src/database";
import {
  DiseaseOccurrenceRepository,
  PatientsRepository,
  SymptomOccurrenceRepository,
  SymptomRepository
} from "../repositories";

class SymptomOccurrenceController {


  async create(request: Request, response: Response) {
    const body = request.body



    const isValidPatient = await PatientsRepository.findOne({
      where: {
        id: body.patient_id
      }
    })

    if (!isValidPatient) {
      return response.status(404).json({
        error: "Paciente não encontrado"
      })
    }

    if (body.symptoms.length == 0) {
      return response.status(404).json({
        error: "Selecione pelo menos um sintoma"
      })
    }



    const existOngoingDiseaseOccurrences = await DiseaseOccurrenceRepository.find({
      where: {
        patientId: body.patient_id,
        status: In(["Suspeito", "Infectado"]),
      }
    })

    body.registered_date = new Date()

    if (existOngoingDiseaseOccurrences.length === 0) {
      try {
        body.disease_occurrence_id = undefined
        const symptomOccurrence = SymptomOccurrenceRepository.create(body)
        await SymptomOccurrenceRepository.save(symptomOccurrence)

        return response.status(201).json({
          success: "Sintoma registrado com sucesso"
        })
      } catch (error) {
        return response.status(403).json({
          error: "Erro no cadastro do sintoma"
        })
      }
    }

    else {
      for (const diseaseOccurrence of existOngoingDiseaseOccurrences) {
        try {
          body.disease_occurrence_id = diseaseOccurrence.id
          const symptomOccurrence = SymptomOccurrenceRepository.create(body)
          await SymptomOccurrenceRepository.save(symptomOccurrence)
        } catch (error) {
          return response.status(403).json({
            error: "Erro no cadastro do sintoma"
          })
        }
      }

      return response.status(201).json({
        success: "Sintoma registrado com sucesso"
      })
    }
  }
  async createSeveral(request: Request, response: Response) {
    const body = request.body

    const isValidPatient = await PatientsRepository.findOne({
      where: {
        id: body.patient_id
      }
    })

    if (!isValidPatient) {
      return response.status(404).json({
        error: "Paciente não encontrado"
      })
    }

    const existOngoingDiseaseOccurrences = await DiseaseOccurrenceRepository.find({
      where: {
        patientId: body.patient_id,
        status: In(["Suspeito", "Infectado"]),
      }
    })

    body.registered_date = new Date()

    if (existOngoingDiseaseOccurrences.length === 0) {

      for (let i in body.symptoms) {
        console.log("Entrei no if: " + body.symptoms[i])
        console.log("Entrei no if: " + body.patient_id)
        console.log("Entrei no if: " + body.disease_occurrence_id)
        console.log("Entrei no if: " + body.registered_date)
      }


      body.disease_occurrence_id = undefined
      for (let i in body.symptoms) {
        try {
          const symptomOccurrence = SymptomOccurrenceRepository.create({
            patientId: body.patient_id,
            diseaseOccurrenceId: body.disease_occurrence_id,
            registeredDate: body.registered_date,
            symptomName: body.symptoms[i]
          })

          await SymptomOccurrenceRepository.save(symptomOccurrence)

        } catch (error) {
          console.log(error)
          return response.status(403).json({
            error: "Erro no cadastro dos sintomas"
          })
        }
      }
    }

    else {
      for (const diseaseOccurrence of existOngoingDiseaseOccurrences) {
        try {
          body.disease_occurrence_id = diseaseOccurrence.id
          for (let i in body.symptoms) {
            const symptomOccurrenceBody = SymptomOccurrenceRepository.create({
              ...body,
              symptom_name: body.symtoms[i]
            })

            await SymptomOccurrenceRepository.save(symptomOccurrenceBody)
          }
        } catch (error) {
          return response.status(403).json({
            error: "Erro no cadastro dos sintomas"
          })
        }
      }
    }

    //Atualizando data de última atualização do paciente
    try {
      await PatientsRepository.createQueryBuilder()
        .update(Patient)
        .set({ updatedAt: body.registered_date })
        .where("id = :id", { id: body.patient_id })
        .execute()
    } catch (error) {
      return response.status(404).json({
        error: "Erro na atualização do status do paciente"
      })
    }

    return response.status(201).json({
      success: "Sintomas registrado com sucesso"
    })
  }

  async getUnassignedOccurrences(request: Request, response: Response) {
    const { page, patient_name } = request.query;
    const take = 10;
    const skip = page ? (Number(page) - 1) * take : 0;


    let whereConditions = "symptomOcurrence.diseaseOccurrence IS NULL";
    const whereParameters: { name?: string } = {};

    if (patient_name) {
      whereConditions += " AND patient.name LIKE :name";
      whereParameters.name = `%${patient_name}%`;
    }

    try {
      const [items, totalCount] = await SymptomOccurrenceRepository.createQueryBuilder("symptomOcurrence")
        .leftJoinAndSelect("symptomOcurrence.patient", "patient") 
        .where(whereConditions, whereParameters)
        .orderBy("symptomOcurrence.registeredDate", "DESC")
        .skip(skip)
        .take(take)
        .getManyAndCount();

      const formattedData = items.map((occurrence) => ({
        id: occurrence.id,
        patient_id: occurrence.patient.id,
        registered_date: occurrence.registeredDate,
        patient: {
          name: occurrence.patient.name,
          email: occurrence.patient.email,
        },
      }));

      return response.status(200).json({
        symptomOccurrences: formattedData,
        totalSymptomOccurrences: totalCount,
      });
    } catch (error) {
      console.error("Erro ao buscar ocorrências não atribuídas:", error);
      return response.status(500).json({
        error: "Erro na listagem das ocorrências de sintomas",
      });
    }
  }


  async list(request: Request, response: Response) {
    const {
      id,
      patient_id,
      symptom_name,
      disease_occurrence_id,
      unassigned
    } = request.query

    let filters = {}

    if (id) {
      filters = { ...filters, id: String(id) }

      const isValidOccurrence = await SymptomOccurrenceRepository.findOne({
        where: {
          id: String(id)
        }
      })

      if (!isValidOccurrence) {
        return response.status(404).json({
          error: "Ocorrência de sintoma não encontrada"
        })
      }
    }

    if (patient_id) {
      filters = { ...filters, patient_id: String(patient_id) }

      const isValidPatient = await PatientsRepository.findOne({
        where: {
          id: String(patient_id)
        }
      })

      if (!isValidPatient) {
        return response.status(404).json({
          error: "Paciente não encontrado"
        })
      }
    }

    if (symptom_name) {
      filters = { ...filters, symptom_name: String(symptom_name) }

      const isValidSymptom = await SymptomRepository.findOne({
        where: {
          symptom: String(symptom_name)
        }
      })

      if (!isValidSymptom) {
        return response.status(404).json({
          error: "Sintoma não encontrado"
        })
      }
    }

    if (disease_occurrence_id) {
      filters = { ...filters, disease_occurrence_id: String(disease_occurrence_id) }

      const isValidDiseaseOccurrence = await DiseaseOccurrenceRepository.findOne({
        where: {
          id: String(disease_occurrence_id)
        }
      })

      if (!isValidDiseaseOccurrence) {
        return response.status(404).json({
          error: "Ocorrência de doença não encontrada"
        })
      }
    }

    if (unassigned) {
      filters = { ...filters, disease_occurrence_id: IsNull() }
    }

    const occurrencesList = await SymptomOccurrenceRepository.find({
      where: filters,
      order: {
        registeredDate: 'DESC'
      }
    })

    return response.status(200).json(occurrencesList)
  }

  async listOccurences(request: Request, response: Response) {
    const { patient_id } = request.body

    let filters = {}

    const isValidOccurrence = await SymptomOccurrenceRepository.find({
      where: {
        patientId: String(patient_id)
      }
    })

    if (!isValidOccurrence) {
      return response.status(404).json({
        error: "Nenhum sintoma cadastrado ainda"
      })
    }

    if (patient_id) {
      filters = { ...filters, patient_id: String(patient_id) }

      const isValidPatient = await PatientsRepository.findOne({
        where: {
          id: String(patient_id)
        }
      })

      if (!isValidPatient) {
        return response.status(404).json({
          error: "Paciente não encontrado"
        })
      }
    }
    const occurrencesList = await SymptomOccurrenceRepository.find({
      where: filters,
      order: {
        registeredDate: 'DESC'
      }
    })

    return response.status(200).json({
      symptoms: occurrencesList
    })
  }

  async alterOne(request: Request, response: Response) {
    const body = request.body
    const { id } = request.params


    const isValidSymptomOccurrence = await SymptomOccurrenceRepository.findOne({ where: { id: id } })

    if (!isValidSymptomOccurrence) {
      return response.status(404).json({
        error: "Ocorrência de sintoma inválida"
      })
    }

    try {
      await SymptomOccurrenceRepository.createQueryBuilder()
        .update(SymptomOccurrence)
        .set(body)
        .where("id = :id", { id })
        .execute()
      return response.status(200).json({
        success: "Ocorrência de doença atualizada com sucesso"
      })
    } catch (error) {
      return response.status(403).json({
        error: "Erro na atualização do sintoma"
      })
    }
  }

  async deleteOne(request: Request, response: Response) {
    const { id } = request.params


    const isValidSymptomOccurrence = await SymptomOccurrenceRepository.findOne({ where: { id: id } })

    if (!isValidSymptomOccurrence) {
      return response.status(404).json({
        error: "Ocorrência de sintoma inválida"
      })
    }

    try {
      await SymptomOccurrenceRepository.createQueryBuilder()
        .delete()
        .from(SymptomOccurrence)
        .where("id = :id", { id })
        .execute()
      return response.status(200).json({
        success: "Ocorrência de doença deletada com sucesso"
      })
    } catch (error) {
      return response.status(403).json({
        error: "Erro na deleção do sintoma"
      })
    }
  }
}

export { SymptomOccurrenceController }