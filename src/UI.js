class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(name, listener) {
        if (!this._events[name]) {
            this._events[name] = [];
        }
        this._events[name].push(listener);
    }

    emit(name, ...args) {
        if (!this._events[name]) {
            return;
        }
        this._events[name].forEach(listener => listener(...args));
    }
}

export class UI extends EventEmitter {
    constructor() {
        super();
        this.uploadStep = document.getElementById('upload-step');
        this.markerStep = document.getElementById('marker-step');
        this.adjustStep = document.getElementById('adjust-step');
        this.loader = document.getElementById('loader');
        this.currentMarkerName = document.getElementById('current-marker-name');
        this.generateBtn = document.getElementById('generate-skeleton-btn');
    }

    init() {
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.emit('file-upload', e.target.files[0]);
            }
        });

        document.querySelectorAll('.cam-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.emit('camera-view-change', btn.dataset.view);
            });
        });
        
        this.generateBtn.addEventListener('click', () => this.emit('generate-skeleton'));
        
        document.getElementById('wireframe-toggle').addEventListener('change', (e) => {
            this.emit('wireframe-toggle', e.target.checked);
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.emit('reset'));
    }

    setLoading(isLoading) {
        this.loader.classList.toggle('hidden', !isLoading);
    }

    showStep(state) {
        this.uploadStep.classList.add('hidden');
        this.markerStep.classList.add('hidden');
        this.adjustStep.classList.add('hidden');

        switch (state) {
            case 'UPLOAD':
                this.uploadStep.classList.remove('hidden');
                break;
            case 'MARKER':
                this.markerStep.classList.remove('hidden');
                break;
            case 'ADJUST':
                this.adjustStep.classList.remove('hidden');
                break;
        }
    }

    updateMarkerInfo(markerName) {
        this.currentMarkerName.textContent = markerName || 'All Done!';
    }
    
    enableGenerateButton(enabled) {
        this.generateBtn.disabled = !enabled;
    }
}