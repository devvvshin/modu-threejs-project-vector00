import THREE from "n3d-threejs"

class Meteo extends THREE.Object3D{
  constructor(camera) {
    super();
    this.velocity = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
    this.readypos = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
    this.response = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
  }

  ready(x, y){
    this.readypos.x = x;
    this.readypos.y = y;
    this.readypos.z = 0;

    this.position.x = x;
    this.position.y = y;
    this.position.z = 0;

    this.scale.x = 0.04;
    this.scale.y = this.scale.x * window.innerWidth / window.innerHeight;


    this.geom = new THREE.BufferGeometry();
    this.geom.addAttribute("position", new THREE.BufferAttribute(
      new Float32Array([
        -1.0, 0.0, 0.0,
         1.0, 0.0, 0.0,
         0.0, 1.0, 0.0
      ]) , 3
    ));
    this.tail = new THREE.Object3D();
    this.tail.add(new THREE.Mesh(
      this.geom,
      new THREE.MeshBasicMaterial({ color : "orange" })
    ))
    this.tail.position.z = 0.01;

    this.head = new THREE.Object3D();
    this.head.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({ color : "red"})
    ));
    this.head.position.z = 0.00;

    this.add(this.tail);
    this.add(this.head);
  }

  drag(x, y) {
    const dx = (this.readypos.x - x);
    const dy = (this.readypos.y - y) * window.innerHeight / window.innerWidth;
    const ln = Math.sqrt(dx * dx + dy * dy);

    this.tail.rotation.z = dy > 0 ? Math.PI - Math.atan(dx/dy) : -Math.atan(dx/dy);
    this.tail.scale.y = Math.max(1.0, ln / this.scale.x);

  }

  start(x, y) {
    this.velocity.x = this.readypos.x - x;
    this.velocity.y = this.readypos.y - y;
    this.velocity.z = 0;

    const limx = 1.0 + this.scale.x;
    const limy = 1.0 + this.scale.y;

    const sx = x;
    const sy = y;
    const ex = this.readypos.x;
    const ey = this.readypos.y;

    const miny = Math.max(Math.min(limy, (sy - ey) / (sx - ex) * (-limx - ex) + ey) , -limy);
    const minx = (miny - ey) * (sx - ex) / (sy - ey) + ex;

    const maxy = Math.max(Math.min(limy, (sy - ey) / (sx - ex) * ( limx - ex) + ey) , -limy);
    const maxx = (maxy - ey) * (sx - ex) / (sy - ey) + ex;

    if(this.velocity.x > 0) {
      this.response.x = minx;
      this.response.y = miny;
    } else {
      this.response.x = maxx;
      this.response.y = maxy;
    }

  }

  update(dt) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    const limx = 1.0 + this.scale.x + this.tail.scale.y * this.scale.y;
    const limy = 1.0 + this.scale.y + this.tail.scale.y * this.scale.y;

    if(Math.abs(this.position.x) > limx || Math.abs(this.position.y) > limy) {
      this.position.x = this.response.x;
      this.position.y = this.response.y;
    }
  }
}

class Canvas {
  constructor() {
    this.texture = new THREE.WebGLRenderTarget(
      window.innerWidth, window.innerHeight, {
      minFilter : THREE.LinearFilter,
      magFilter : THREE.LinearFilter,
    });

    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    //Regist Events
    document.body.addEventListener("mousedown", ({pageX, pageY}) => {
      const x = (pageX / window.innerWidth) * 2.0 - 1.0;
      const y = 1.0 - (pageY / window.innerHeight) * 2.0;
      this.lastobj = new Meteo();
      this.scene.add(this.lastobj);
      this.lastobj.ready(x, y);
    });
    document.body.addEventListener("mousemove", ({pageX, pageY}) => {
      const x = (pageX / window.innerWidth) * 2.0 - 1.0;
      const y = 1.0 - (pageY / window.innerHeight) * 2.0;
      if(this.lastobj) this.lastobj.drag(x, y);
    });
    document.body.addEventListener("mouseup", ({pageX, pageY}) => {
      const x = (pageX / window.innerWidth) * 2.0 - 1.0;
      const y = 1.0 - (pageY / window.innerHeight) * 2.0;
      if(this.lastobj) this.lastobj.start(x, y);
      this.lastobj = undefined;
    });
  }

  update(dt) {
    this.scene.children.forEach((obj) => {
      if(obj.update) obj.update(dt);
    })
  }

  render(rdrr) {
    rdrr.render(this.scene, this.camera);
  }
}


class Display {
  getDeltaTime() {
    if(this.oldt == undefined) this.newt = this.oldt = new Date();
    this.oldt = this.newt;
    this.newt = new Date();
    return (this.newt - this.oldt) * 0.001;
  }

  constructor() {
    this.renderer = new THREE.WebGLRenderer({alpha : true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.canvas = new Canvas();
  }

  //public Function
  update() {
    var dt = this.getDeltaTime();
    this.canvas.update(dt);
  }

  render() {
    this.canvas.render(this.renderer);
  }

}

export default Display;
