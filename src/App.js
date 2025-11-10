import { Viewer } from './Viewer.js';
import { UI } from './UI.js';
import { Rigging } from './Rigging.js';
import { ModelLoader } from './ModelLoader.js';

class App {
    constructor() {
        this.viewer = new Viewer('bg');
        this.rigging = new Rigging(this.viewer);
        this.modelLoader = new ModelLoader(this.viewer);
        this.ui = new UI();
        this.state = 'UPLOAD'; // UPLOAD, MARKER, ADJUST
    }

    init() {
        this.viewer.init();
        this.ui.init();
        this.setupEventListeners();
        this.updateUIForState();
    }

    setupEventListeners() {
        this.ui.on('file-upload', (file) => this.handleFileUpload(file));
        this.ui.on('camera-view-change', (view) => this.viewer.setCameraView(view));
        this.ui.on('generate-skeleton', () => this.generateSkeleton());
        this.ui.on('wireframe-toggle', (isTransparent) => this.viewer.setModelTransparency(isTransparent));
        this.ui.on('reset', () => this.reset());

        this.viewer.canvas.addEventListener('click', (event) => {
            if (this.state !== 'MARKER' || !this.viewer.model) return;
            const intersect = this.viewer.getIntersection(event);
            if (intersect) {
                this.rigging.placeNextMarker(intersect.point);
                this.ui.updateMarkerInfo(this.rigging.getCurrentMarkerName());
                if (this.rigging.areAllMarkersPlaced()) {
                    this.ui.enableGenerateButton(true);
                }
            }
        });
    }

    async handleFileUpload(file) {
        this.ui.setLoading(true);
        try {
            const model = await this.modelLoader.load(file);
            this.viewer.displayModel(model);
            this.state = 'MARKER';
            this.updateUIForState();
            this.ui.updateMarkerInfo(this.rigging.getCurrentMarkerName());
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Failed to load the model. Please check the console for details.');
            this.state = 'UPLOAD';
            this.updateUIForState();
        } finally {
            this.ui.setLoading(false);
        }
    }
    
    generateSkeleton() {
        if (!this.rigging.areAllMarkersPlaced()) return;
        this.rigging.createSkeleton();
        this.state = 'ADJUST';
        this.updateUIForState();
        this.viewer.setCameraView('perspective');
        this.viewer.setModelTransparency(true);
    }

    updateUIForState() {
        this.ui.showStep(this.state);
    }
    
    reset() {
        this.viewer.clearScene();
        this.rigging.reset();
        this.state = 'UPLOAD';
        this.updateUIForState();
    }
}

export default App;

