document.addEventListener("DOMContentLoaded", function() {
    init();
});
function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.setScalar(5);
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x404040);
    var canvas = renderer.domElement;
    document.body.appendChild(canvas);

    var orbitControls = new THREE.OrbitControls(camera, canvas);

    var upoints = []; // positions of control points for the uniform

    var controlPoints = [];
    var dragControls = new THREE.DragControls(controlPoints, camera, canvas);
    dragControls.addEventListener("dragstart", function (event) {
        orbitControls.enabled = false;
    });
    dragControls.addEventListener("dragend", function (event) {
        orbitControls.enabled = true;
    });

//scene.add(new THREE.GridHelper(10, 10, "gray", "gray"));

    let dimX = 5;
    let dimY = 4;
    let dimZ = 2;

// create control points
// createControlPoint(-dimX / 2, -dimY / 2, -dimZ / 2, "black", controlPoints, upoints);
// createControlPoint( dimX / 2, -dimY / 2, -dimZ / 2, "red", controlPoints, upoints);
// createControlPoint(-dimX / 2,  dimY / 2, -dimZ / 2, "green", controlPoints, upoints);
// createControlPoint( dimX / 2,  dimY / 2, -dimZ / 2, "yellow", controlPoints, upoints);

    createControlPoint(-dimX / 2, -dimY / 2, dimZ / 2, "blue", controlPoints, upoints);
    createControlPoint(dimX / 2, -dimY / 2, dimZ / 2, "magenta", controlPoints, upoints);
    createControlPoint(-dimX / 2, dimY / 2, dimZ / 2, "aqua", controlPoints, upoints);
    createControlPoint(dimX / 2, dimY / 2, dimZ / 2, "white", controlPoints, upoints);

    let geometry = get3DGrid(dimX, dimY, dimZ);

    let material = new THREE.LineBasicMaterial({vertexColors: THREE.VertexColors});
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

    let lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    render();

    function render() {
        if (resize(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
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
        let geometry = new THREE.BufferGeometry();

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
        let colors = [];
        for (let i = 0; i < n; i++) {
            let p = mapTo3D(i);
            let x = p.x / (xSize - 1);
            let y = p.y / (ySize - 1);
            let z = p.z / (zSize - 1);
            positions.push(x, y, z);
            colors.push(x, y, z);
        }
        geometry.addAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        let indexPairs = [];
        for (let i = 0; i < n; i++) {
            let p = mapTo3D(i);
            if (p.x + 1 < xSize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x + 1, p.y, p.z));
            }
            if (p.y + 1 < ySize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x, p.y + 1, p.z));
            }
            if (p.z + 1 < zSize) {
                indexPairs.push(i);
                indexPairs.push(mapFrom3D(p.x, p.y, p.z + 1));
            }
        }
        geometry.setIndex(indexPairs);
        return geometry;
    }

    function createControlPoint(posX, posY, posZ, color, controlPoints, upoints) {
        let dim = 0.25;
        let pointGeometry = new THREE.BoxGeometry(dim, dim, dim);
        let pointMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5
        });
        let controlPoint = new THREE.Mesh(pointGeometry, pointMaterial);
        controlPoint.position.set(posX, posY, posZ);
        controlPoints.push(controlPoint);
        upoints.push(controlPoint.position);
        scene.add(controlPoint);
    }
}
