import THREE from "n3d-threejs"

class Meteo extends THREE.Object3D{
  constructor(camera) {
    super();
    this.velocity = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
    this.readypos = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
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

    this.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({ color : "red"})
    ));
  }

  start(x, y) {
    this.velocity.x = this.readypos.x - x;
    this.velocity.y = this.readypos.y - y;
    this.velocity.z = 0;
  }

  update(dt) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    if(Math.abs(this.position.x) > 1.0 + this.scale.x) this.position.x = -Math.sign(this.position.x);
    if(Math.abs(this.position.y) > 1.0 + this.scale.y) this.position.y = -Math.sign(this.position.y);
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
    document.body.addEventListener("mouseup", ({pageX, pageY}) => {
      const x = (pageX / window.innerWidth) * 2.0 - 1.0;
      const y = 1.0 - (pageY / window.innerHeight) * 2.0;
      this.lastobj.start(x, y);
    });
  }

  update(dt) {
    this.scene.children.forEach((obj) => {
      if(obj.update) obj.update(dt);
    })
  }

  render(rdrr) {
    rdrr.render(this.scene, this.camera, this.texture);
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
    this.camera = new THREE.Camera();

    this.oldtex = new THREE.WebGLRenderTarget(
      window.innerWidth, window.innerHeight, {
        minFilter : THREE.LinearFilter,
        magFilter : THREE.LinearFilter,
      }
    );
    this.newtex = new THREE.WebGLRenderTarget(
      window.innerWidth, window.innerHeight, {
        minFilter : THREE.LinearFilter,
        magFilter : THREE.LinearFilter,
      }
    );

    this.oldscn = new THREE.Scene();
    this.oldscn.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({map : this.newtex})
    ));

    this.uniforms = {
      unif_oldtexture : { type : "t" ,value : this.canvas.texture },
      unif_newtexture : { type : "t" ,value : this.oldtex},
      unif_deltatime : { type : "f", value : 0.0}
    } ;

    this.newscn = new THREE.Scene();
    this.newscn.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.ShaderMaterial({
        uniforms : this.uniforms,
        fragmentShader : `
        uniform sampler2D unif_oldtexture;
        uniform sampler2D unif_newtexture;
        uniform float unif_deltatime;

        varying vec2 vtex;
        void main(void) {
          vec4 oldcol = texture2D(unif_oldtexture, vtex);
          vec4 newcol = texture2D(unif_newtexture, vtex);
          oldcol.a -= unif_deltatime;

          gl_FragColor = oldcol + newcol;
        }
        `,
        vertexShader : `
        varying vec2 vtex;
        void main(void) {
          vtex = uv;
          gl_Position = vec4(position, 1.0);
        }
        `
      })
    ));
  }

  //public Function
  update() {
    var dt = this.getDeltaTime();
    this.uniforms.unif_deltatime.value = dt;
    this.canvas.update(dt);
  }

  render() {
    this.canvas.render(this.renderer);
    this.renderer.render(this.newscn, this.camera, this.newtex);
    this.renderer.render(this.oldscn, this.camera, this.oldtex);
    this.renderer.render(this.newscn, this.camera);
  }

}

export default Display;
