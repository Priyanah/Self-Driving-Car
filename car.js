class Car {
  constructor(x, y, width, height, controlType, maxspeed = 3) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0.0;
    this.acceleration = 0.2;
    this.maxspeed = maxspeed;
    this.fricition = 0.05;

    this.angle = 0;

    this.damaged = false;

    this.useBrain = controlType == "AI";

    if (controlType != "DUMMY") {
      this.sensor = new Sensors(this);
      this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
    }

    this.controls = new Controls(controlType);
  }

  update(roadBorders, traffic) {
    if (!this.damaged) {
      this.#move();
      this.polygon = this.#createPolygon();
      this.damaged = this.#accessDamage(roadBorders, traffic);
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic);
      const offsets = this.sensor.readings.map((s) =>
        s == null ? 0 : 1 - s.offset
      );

      const outputs = NeuralNetwork.feedForward(offsets, this.brain);

      if (this.useBrain) {
        this.controls.forward = outputs[0];
        this.controls.left = outputs[1];
        this.controls.right = outputs[2];
        this.controls.reverse = outputs[3];
      }
    }
  }

  #accessDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (ploysIntersect(this.polygon, roadBorders[i])) {
        return true;
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (ploysIntersect(this.polygon, traffic[i].polygon)) {
        return true;
      }
    }
    return false;
  }

  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2;
    const alpha = Math.atan2(this.width, this.height); //The math module also provides the atan2() function, which returns the arc tangent of y/x, in radians.
    // for top right corner.
    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad,
    });
    // for top left corner.
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad,
    });
    // for left side corner.
    // points.push({
    //   x: this.x - Math.sin(this.angle + alpha),
    //   y: this.y - Math.tan(this.angle - alpha),
    // });

    // for bottom left corner.
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
    });

    // for bottom right corner.
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
    });

    // for right side corner.
    // points.push({
    //   x: this.x - Math.sin(this.angle + alpha),
    //   y: this.y - Math.tan(this.angle + alpha),
    // });

    return points;
  }

  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.reverse) {
      this.speed -= this.acceleration;
    }
    if (this.speed > this.maxspeed) {
      this.speed = this.maxspeed;
    }
    if (this.speed < -this.maxspeed / 2) {
      // "-" here minus is only declared to relate reverse.
      //reverse speed sholud be half of forward.
      this.speed = -this.maxspeed / 2;
    }
    if (this.speed > 0) {
      this.speed -= this.fricition;
    }
    if (this.speed < 0) {
      this.speed += this.fricition;
    }
    // below if is defined because the car will continue to move if the key is not pressed because of friction,
    // to avoid that below function is defined.
    if (Math.abs(this.speed) < this.fricition) {
      this.speed = 0;
    }
    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (this.controls.left) {
        this.angle += 0.03 * flip;
      }
      if (this.controls.right) {
        this.angle -= 0.03 * flip;
      }
    }
    this.x -= Math.sin(this.angle) * this.speed; // by this the car can go in each angle, by the help of Unit Circle information.
    this.y -= Math.cos(this.angle) * this.speed; // by this the car can go in each angle, by the help of Unit Circle information.
  }
  draw(ctx, color, drawSensor = false) {
    if (this.damaged) {
      ctx.fillStyle = "gray";
    } else {
      ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
    }
    ctx.fill();

    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx);
    }
  }
}
