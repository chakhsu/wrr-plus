import Joi from 'joi'

export type OptionsSchema = {
  reverse: boolean
  max: number
  min: number
  filter: {
    enable: boolean
    number: number
    totalWeight: number
    ratio: number
  }
}
export type OptionsType = Partial<OptionsSchema>

const schema = Joi.object()
  .keys({
    reverse: Joi.boolean().default(false),
    max: Joi.number().max(10000).min(20).default(100),
    min: Joi.number().max(20).min(1).default(20),
    filter: Joi.object()
      .keys({
        enable: Joi.boolean().default(false),
        number: Joi.number().max(10000).min(1).default(3),
        totalWeight: Joi.number().max(10000).min(1).default(100),
        ratio: Joi.number().max(1).min(0).default(0)
      })
      .default()
  })
  .default()

export const attempt = (options?: OptionsType): OptionsSchema => {
  return Joi.attempt(options || {}, schema)
}
