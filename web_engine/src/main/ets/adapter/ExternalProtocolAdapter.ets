/*
 * Copyright (c) 2023-2025 Haitai FangYuan Co., Ltd.
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 *    conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 *    of conditions and the following disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used
 *    to endorse or promote products derived from this software without specific prior written
 *    permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { inject, injectable } from 'inversify';
import { Want, wantConstant } from '@kit.AbilityKit';
import common from '@ohos.app.ability.common';
import { BusinessError } from '@kit.BasicServicesKit';

import { BaseAdapter } from '../common/BaseAdapter';
import LogMethod from '../common/LogDecorator';
import LogUtil from '../utils/LogUtil';
import LaunchHelper from '../utils/LaunchHelper';
import { ContextAdapter } from './ContextAdapter';

const TAG = 'ExternalProtocolAdapter';

@injectable()
export class ExternalProtocolAdapter extends BaseAdapter {
  private ctxAdapter: ContextAdapter;

  constructor(@inject(ContextAdapter) ctxAdapter: ContextAdapter) {
    super();
    this.ctxAdapter = ctxAdapter;
  }

  @LogMethod
  openExternal(urlStr: string) {
    const context = this.ctxAdapter.getActiveContext() as common.UIAbilityContext;
    if (context && typeof context.openLink === 'function') {
      try {
        context.openLink(urlStr, { appLinkingOnly: false })
          .then(() => LogUtil.info(TAG, `openLink success: ${urlStr}`))
          .catch((err: BusinessError) => {
            LogUtil.error(TAG, `openLink failed: ${JSON.stringify(err)}, falling back to startAbility`);
            this.fallbackStartAbility(urlStr);
          });
        return;
      } catch (e) {
        LogUtil.error(TAG, `openLink exception: ${JSON.stringify(e)}`);
      }
    }
    this.fallbackStartAbility(urlStr);
  }

  private fallbackStartAbility(urlStr: string) {
    const want: Want = {
      action: 'ohos.want.action.viewData',
      entities: ['entity.system.browsable'],
      uri: urlStr,
      flags: wantConstant.Flags.FLAG_START_WITHOUT_TIPS
    }
    LaunchHelper.Launch(this.ctxAdapter.getActiveContext(), want);
  }
}
