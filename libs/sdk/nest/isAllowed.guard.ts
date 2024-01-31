import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Type,
} from '@nestjs/common';
import { FieldStateResult } from '@prici/shared-remult';
import { PriciService } from './prici.service';

import type { PriciSdk as PriciSdkInternal } from '../index';

type PriciSdk = Omit<PriciSdkInternal, '#private'>;

export interface IsAllowedGuardOptions {
  sdk?: PriciSdk;
  fieldId?: string;
  errorMessage?: string;
  incrementAmount?: number;
  getAccountId?: (req?: any) => string | Promise<string>;
  getFieldId?: (req?: any) => string | Promise<string>;
  getError?: (
    req?: any,
    fieldStateResult?: FieldStateResult
  ) => string | Promise<string>;
  getIncrementAmount?: (req?: any) => number;
}

export function IsAllowedGuard(
  options: IsAllowedGuardOptions
): Type<CanActivate> {
  class IsAllowedMixin implements CanActivate {
    options: IsAllowedGuardOptions;

    constructor(
      @Inject(PriciService) public readonly priciService: PriciService
    ) {
      this.options = options;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const opts = {
        sdk: this.options.sdk || this.priciService.sdk,
        getAccountId: async (req: any) =>
          req.accountId ||
          req.account?.id ||
          req.user?.account ||
          req.user?.tenant,
        getFieldId: async (req: any) => this.options.fieldId || req.fieldId,
        getError: async (req?: any) =>
          this.options.errorMessage ||
          this.priciService.sdk.defaultErrorMessage,
        getIncrementAmount: () => this.options.incrementAmount,
        ...this.options,
      };

      const ctx = context.switchToHttp();
      const req = ctx.getRequest();
      const res = ctx.getResponse();
      const [accountId, fieldId] = await Promise.all([
        opts.getAccountId(req),
        opts.getFieldId(req),
      ]);

      if (!(accountId && fieldId)) {
        return true;
      }

      const result = await opts.sdk.getFieldState(accountId, fieldId);

      if (!result.isAllowed) {
        const errorMessage = await opts.getError(req, result);
        throw new HttpException(errorMessage, HttpStatus.PAYMENT_REQUIRED);
      }

      res.once('finish', () => {
        if (res.statusCode.toString().startsWith('2')) {
          opts.sdk
            .incrementField(
              accountId,
              fieldId,
              opts.getIncrementAmount(req) || undefined
            )
            .catch();
        }
      });

      return true;
    }
  }

  return IsAllowedMixin;
}
