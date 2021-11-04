document.addEventListener("DOMContentLoaded", function() {
    init();
});
function init() {
    let renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    let canvas = renderer.domElement;
    document.body.appendChild(canvas);

    let upoints = []; // positions of control points for the uniform
    let dimX = 2;
    let dimY = 2;
    let dimZ = 2;

    let controlPoints = [];
    let scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera( -5, 5, -5, 5);
     camera.position.z = 5;

    new THREE.DragControls(controlPoints, camera, canvas);

    // create control points
    createControlPoint(-dimX / 2, -dimY / 2, dimZ / 2, "red", controlPoints, upoints);
    createControlPoint(dimX / 2, -dimY / 2, dimZ / 2, "red", controlPoints, upoints);
    createControlPoint(-dimX / 2, dimY / 2, dimZ / 2, "red", controlPoints, upoints);
    createControlPoint(dimX / 2, dimY / 2, dimZ / 2, "red", controlPoints, upoints);

    let geometry = get3DGrid(dimX, dimY, dimZ);

    const texture = new THREE.TextureLoader().load( "half-moon.png" );

    let material = new THREE.MeshBasicMaterial({map: texture, color: 'white', emissive: 'white', side: THREE.DoubleSide});
    material.onBeforeCompile = shader => {
        shader.uniforms.upoints = {value: upoints};
        shader.vertexShader = `
    uniform vec3 upoints[4];
  ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>

    vec3 farBottomX = (upoints[1] - upoints[0]) * position.x + upoints[0];
    vec3 farTopX = (upoints[3] - upoints[2]) * position.x + upoints[2];

    vec3 nearBottomX = (upoints[1] - upoints[0]) * position.x + upoints[0];
    vec3 nearTopX = (upoints[3] - upoints[2]) * position.x + upoints[2];

    vec3 farY = (farTopX - farBottomX) * position.y + farBottomX;
    vec3 nearY = (nearTopX - nearBottomX) * position.y + nearBottomX;

    transformed = (nearY - farY) * position.z + farY;

    `
        );

    }

    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    render();

    function render() {
        if (resize(renderer)) {
            camera.updateProjectionMatrix();
            console.log('resize?');
        }
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    function resize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function get3DGrid(xSize, ySize, zSize) {
        let n = xSize * ySize * zSize;
        let geometry = new THREE.PlaneBufferGeometry();

        function mapTo3D(i) {
            let z = Math.floor(i / (xSize * ySize));
            i -= z * xSize * ySize;
            let y = Math.floor(i / xSize);
            let x = i % xSize;
            return {
                x: x,
                y: y,
                z: z
            };
        }

        function mapFrom3D(x, y, z) {
            return x + y * xSize + z * xSize * ySize;
        }
        let positions = [];

        for (let i = 0; i < n; i++) {
            let p = mapTo3D(i);
            let x = p.x / (xSize - 1);
            let y = p.y / (ySize - 1);
            let z = p.z / (zSize - 1);
            positions.push(x, y, z);
        }

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        let indexPairs = [];
        let uvs = [];
        for (let i = 0; i < n; i++) {
            let p = mapTo3D(i);
            if (p.x + 1 < xSize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x + 1, p.y, p.z));
                uvs.push(i);
                uvs.push(mapFrom3D(p.x + 1, p.y, p.z));
            }
            if (p.y + 1 < ySize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x, p.y + 1, p.z));
                uvs.push(i);
                uvs.push(mapFrom3D(p.x, p.y + 1, p.z));
            }
            if (p.z + 1 < zSize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x, p.y, p.z + 1));
                uvs.push(i);
                uvs.push(mapFrom3D(p.x, p.y, p.z + 1));
            }
        }
        geometry.setIndex(indexPairs);

        var max = geometry.boundingBox.max,
            min = geometry.boundingBox.min;
        var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
        var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
        var faces = geometry.faces;

        for (var i = 0; i < faces.length ; i++) {

            var v1 = geometry.vertices[faces[i].a],
                v2 = geometry.vertices[faces[i].b],
                v3 = geometry.vertices[faces[i].c];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
                new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
                new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
            ]);
        }
        geometry.uvsNeedUpdate = true;

        return geometry;
    }

    function createControlPoint(posX, posY, posZ, color, controlPoints, upoints) {
        let circleGeometry = new THREE.CircleGeometry(.125, 16);
        let circleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color,
            side: THREE.DoubleSide,
        });
        let controlPoint = new THREE.Mesh(circleGeometry, circleMaterial);
        controlPoint.position.set(posX, posY, posZ);
        controlPoints.push(controlPoint);
        upoints.push(controlPoint.position);
        scene.add(controlPoint);
    }
}
