/**
 * エアホッケー用物理エンジン (JavaScript版)
 * 円形の剛体衝突システム
 */

class RigidBody {
  constructor(x, y, vx = 0, vy = 0, mass = 1.0, radius = 15, restitution = 0.9, friction = 0.3, isStatic = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.spin = 0.0;
    this.spinAngle = 0.0;
    this.mass = mass;
    this.radius = radius;
    this.restitution = restitution;
    this.friction = friction;
    this.isStatic = isStatic;
    this.momentOfInertia = isStatic ? Infinity : 0.5 * mass * radius * radius;
  }

  applyImpulse(impulseX, impulseY, contactX = null, contactY = null) {
    if (this.isStatic) return;

    this.vx += impulseX / this.mass;
    this.vy += impulseY / this.mass;

    if (contactX !== null && contactY !== null) {
      const rx = contactX - this.x;
      const ry = contactY - this.y;
      const torque = rx * impulseY - ry * impulseX;
      this.spin += torque / this.momentOfInertia;
    }
  }
}

class CollisionDetector {
  static detectCircleCircle(body1, body2) {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.001) dist = 0.001;

    const collisionDist = body1.radius + body2.radius;

    if (dist < collisionDist) {
      const overlap = collisionDist - dist;
      const normalX = dx / dist;
      const normalY = dy / dist;
      const contactX = body1.x + normalX * body1.radius;
      const contactY = body1.y + normalY * body1.radius;

      return { collided: true, normalX, normalY, overlap, contactX, contactY };
    }

    return { collided: false };
  }

  static resolveCollision(body1, body2, normalX, normalY, overlap, contactX, contactY) {
    const r1x = contactX - body1.x;
    const r1y = contactY - body1.y;
    const v1ContactX = body1.vx - body1.spin * r1y;
    const v1ContactY = body1.vy + body1.spin * r1x;

    const r2x = contactX - body2.x;
    const r2y = contactY - body2.y;
    const v2ContactX = body2.vx - body2.spin * r2y;
    const v2ContactY = body2.vy + body2.spin * r2x;

    const relVx = v2ContactX - v1ContactX;
    const relVy = v2ContactY - v1ContactY;
    const relVNormal = relVx * normalX + relVy * normalY;

    if (relVNormal >= 0) return;

    const e = (body1.restitution + body2.restitution) / 2;

    const r1CrossN = r1x * normalY - r1y * normalX;
    const r2CrossN = r2x * normalY - r2y * normalX;

    let invMassSum = 0;
    if (!body1.isStatic) {
      invMassSum += 1.0 / body1.mass + (r1CrossN * r1CrossN) / body1.momentOfInertia;
    }
    if (!body2.isStatic) {
      invMassSum += 1.0 / body2.mass + (r2CrossN * r2CrossN) / body2.momentOfInertia;
    }

    const jNormal = -(1 + e) * relVNormal / invMassSum;

    const tangentX = -normalY;
    const tangentY = normalX;
    const relVTangent = relVx * tangentX + relVy * tangentY;

    const mu = (body1.friction + body2.friction) / 2;

    const r1CrossT = r1x * tangentY - r1y * tangentX;
    const r2CrossT = r2x * tangentY - r2y * tangentX;

    let invMassSumTangent = 0;
    if (!body1.isStatic) {
      invMassSumTangent += 1.0 / body1.mass + (r1CrossT * r1CrossT) / body1.momentOfInertia;
    }
    if (!body2.isStatic) {
      invMassSumTangent += 1.0 / body2.mass + (r2CrossT * r2CrossT) / body2.momentOfInertia;
    }

    const jTangentMax = mu * Math.abs(jNormal);
    const jTangentNoFriction = invMassSumTangent > 0 ? -relVTangent / invMassSumTangent : 0;

    let jTangent;
    if (Math.abs(jTangentNoFriction) < jTangentMax) {
      jTangent = jTangentNoFriction;
    } else {
      jTangent = relVTangent > 0 ? -jTangentMax : jTangentMax;
    }

    const impulseX = jNormal * normalX + jTangent * tangentX;
    const impulseY = jNormal * normalY + jTangent * tangentY;

    body1.applyImpulse(-impulseX, -impulseY, contactX, contactY);
    body2.applyImpulse(impulseX, impulseY, contactX, contactY);

    if (overlap > 0) {
      const invMass1 = body1.isStatic ? 0 : 1.0 / body1.mass;
      const invMass2 = body2.isStatic ? 0 : 1.0 / body2.mass;
      const totalInvMass = invMass1 + invMass2;

      if (totalInvMass > 0) {
        const correction1 = overlap * invMass1 / totalInvMass;
        const correction2 = overlap * invMass2 / totalInvMass;

        if (!body1.isStatic) {
          body1.x -= normalX * correction1;
          body1.y -= normalY * correction1;
        }

        if (!body2.isStatic) {
          body2.x += normalX * correction2;
          body2.y += normalY * correction2;
        }
      }
    }
  }
}

class PhysicsEngine {
  constructor() {
    this.FIELD_WIDTH = 800;
    this.FIELD_HEIGHT = 600;
    this.GOAL_Y_MIN = 200;
    this.GOAL_Y_MAX = 400;
  }

  checkWallCollisions(body, player = null) {
    const MARGIN = 15;
    let collided = false;

    // 上の壁
    if (body.y - body.radius < 0) {
      body.y = body.radius;
      body.vy = Math.abs(body.vy) * body.restitution;
      collided = true;
    }

    // 下の壁
    if (body.y + body.radius > this.FIELD_HEIGHT) {
      body.y = this.FIELD_HEIGHT - body.radius;
      body.vy = -Math.abs(body.vy) * body.restitution;
      collided = true;
    }

    // 左の壁（ゴール除く）
    if (body.x - body.radius < MARGIN) {
      if (body.y < this.GOAL_Y_MIN || body.y > this.GOAL_Y_MAX) {
        body.x = MARGIN + body.radius;
        body.vx = Math.abs(body.vx) * body.restitution;
        collided = true;
      }
    }

    // 右の壁（ゴール除く）
    if (body.x + body.radius > this.FIELD_WIDTH - MARGIN) {
      if (body.y < this.GOAL_Y_MIN || body.y > this.GOAL_Y_MAX) {
        body.x = this.FIELD_WIDTH - MARGIN - body.radius;
        body.vx = -Math.abs(body.vx) * body.restitution;
        collided = true;
      }
    }

    // センターライン（プレイヤー専用）
    const CENTER_X = this.FIELD_WIDTH / 2;
    if (player === 'player1' && body.x + body.radius > CENTER_X) {
      body.x = CENTER_X - body.radius;
      body.vx = -Math.abs(body.vx) * body.restitution;
      collided = true;
    } else if (player === 'player2' && body.x - body.radius < CENTER_X) {
      body.x = CENTER_X + body.radius;
      body.vx = Math.abs(body.vx) * body.restitution;
      collided = true;
    }

    return collided;
  }

  checkGoal(puckBody) {
    // 左ゴール（Player2の得点）
    if (puckBody.x + puckBody.radius < 0) {
      if (this.GOAL_Y_MIN <= puckBody.y && puckBody.y <= this.GOAL_Y_MAX) {
        return 2;
      }
    }

    // 右ゴール（Player1の得点）
    if (puckBody.x - puckBody.radius > this.FIELD_WIDTH) {
      if (this.GOAL_Y_MIN <= puckBody.y && puckBody.y <= this.GOAL_Y_MAX) {
        return 1;
      }
    }

    return 0;
  }
}

module.exports = { RigidBody, CollisionDetector, PhysicsEngine };
