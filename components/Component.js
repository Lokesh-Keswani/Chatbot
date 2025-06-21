// Base Component class for the application
class Component {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.element = null;
        this.lastRender = null;
    }

    setState(newState, callback) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        if (callback) {
            callback();
        }
        
        // Only update DOM if the component is mounted
        if (this.element) {
            this.updateDOM();
        }
        
        // Call componentDidUpdate
        this.componentDidUpdate(this.props, prevState);
    }

    updateDOM() {
        if (!this.element) return;
        
        // Get the new HTML
        const newHTML = this.render();
        
        // Only update if the HTML actually changed
        if (newHTML !== this.lastRender) {
            this.element.innerHTML = newHTML;
            this.lastRender = newHTML;
            
            // Re-attach event listeners
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        // Override in subclasses to attach event listeners
    }

    mount(container) {
        this.element = container;
        const html = this.render();
        container.innerHTML = html;
        this.lastRender = html;
        this.attachEventListeners();
        this.componentDidMount();
    }

    render() {
        // Override in subclasses
        throw new Error('Component must implement render method');
    }

    componentDidMount() {
        // Override in subclasses if needed
    }

    componentDidUpdate(prevProps, prevState) {
        // Override in subclasses if needed
    }

    componentWillUnmount() {
        // Override in subclasses if needed
    }
}

// Make Component globally available
window.Component = Component; 