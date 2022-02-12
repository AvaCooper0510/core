import { JwtService } from '@nestjs/jwt'
import {
  GatewayMetadata,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Emitter } from '@socket.io/redis-emitter'
import { resolve } from 'path'
import SocketIO, { Socket } from 'socket.io'
import { LOG_DIR } from '~/constants/path.constant'
import { CacheService } from '~/processors/cache/cache.service'
import { getTodayLogFilePath } from '~/utils/consola.util'
import { AuthService } from '../../../modules/auth/auth.service'
import { EventTypes } from '../events.types'
import { AuthGateway } from './auth.gateway'

@WebSocketGateway<GatewayMetadata>({ namespace: 'admin' })
export class AdminEventsGateway
  extends AuthGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly authService: AuthService,
    private readonly cacheService: CacheService,
  ) {
    super(jwtService, authService)
  }

  subscribeSocketToHandlerMap = new WeakMap<Socket, Function>()

  @SubscribeMessage('log')
  async subscribeStdOut(client: Socket, data?: { prevLog?: boolean }) {
    const { prevLog = true } = data || {}
    if (this.subscribeSocketToHandlerMap.has(client)) {
      return
    }

    const handler = (data) => {
      client.send(this.gatewayMessageFormat(EventTypes.STDOUT, data))
    }

    this.subscribeSocketToHandlerMap.set(client, handler)
    if (prevLog) {
      const stream = fs
        .createReadStream(resolve(LOG_DIR, getTodayLogFilePath()), {
          encoding: 'utf-8',
          highWaterMark: 32 * 1024,
        })
        .on('data', handler)
        .on('end', () => {
          this.cacheService.subscribe('log', handler)
          stream.close()
        })
    } else {
      this.cacheService.subscribe('log', handler)
    }
  }

  @SubscribeMessage('unlog')
  unsubscribeStdOut(client: Socket) {
    const cb = this.subscribeSocketToHandlerMap.get(client)
    if (cb) {
      this.cacheService.unsubscribe('log', cb as any)
    }
    this.subscribeSocketToHandlerMap.delete(client)
  }

  handleDisconnect(client: SocketIO.Socket) {
    super.handleDisconnect(client)
    this.unsubscribeStdOut(client)
  }

  broadcast(event: EventTypes, data: any) {
    const client = new Emitter(this.cacheService.getClient())
    client.of('/admin').emit('message', this.gatewayMessageFormat(event, data))
  }
}
