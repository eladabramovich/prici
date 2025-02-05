import { Remult } from 'remult';
import { Plan } from '@prici/shared-remult/entities/plan';
import { PlanField } from '@prici/shared-remult/entities/plan-field';
import { AccountPlan } from '@prici/shared-remult/entities/account-plan';
import AccountFieldsController from '@prici/shared-remult/controllers/account-fields.controller';

import { FieldKind, ResetMode, FieldState, FieldInPlan } from '@prici/shared-remult/entities/types'

export interface PriciSdkOptions {
  token?: string,
  priciUBaseUrl?: string
}

export class PriciSdk {
  #remult = new Remult();
  #accountFields = new AccountFieldsController()

  Plan = this.#remult.repo(Plan);
  PlanField = this.#remult.repo(PlanField);
  AccountPlan = this.#remult.repo(AccountPlan);

  constructor({ token, priciUBaseUrl }: PriciSdkOptions = {}) {
    token = token || process.env.PRICI_TOKEN;
    priciUBaseUrl = priciUBaseUrl || process.env.PRICI_BASE_URL;
    this.#remult.apiClient.url = priciUBaseUrl + '/api'
    if (token) {
      this.#remult.apiClient.httpClient = (...args) => {
        const opts: RequestInit = args[1] || {}

        opts.headers = {
          ...opts.headers,
          Authorization: 'Bearer ' + token
        }

        args[1] = opts;
        return fetch(...args)
      }
    }
  }

  incrementField(accountId: string, fieldId: string, incrementAmount?: number | any) {
    return this.#remult.call(this.#accountFields.incrementField, this.#accountFields, accountId, fieldId, incrementAmount)
  }

  getFieldState(accountId: string, fieldId: string, allowedValue?: number | string) {
    return this.#remult.call(this.#accountFields.getFieldState, this.#accountFields, accountId, fieldId, allowedValue)
  }

}

export const initialize = (opts: PriciSdkOptions = {}) => {
  return new PriciSdk(opts);
}

export default PriciSdk;

export { Plan, PlanField, AccountPlan, FieldKind, ResetMode, FieldState, FieldInPlan }


