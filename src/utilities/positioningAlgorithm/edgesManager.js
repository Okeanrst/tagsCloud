const TOP = 'top';
const RIGHT = 'right';
const BOTTOM = 'bottom';
const LEFT = 'left';

export const edgesOrder = [TOP, RIGHT, BOTTOM, LEFT];

export const edges = {TOP, RIGHT, BOTTOM, LEFT};

class EdgesManager {
	constructor() {
		this.edgesStatistics = {[TOP]: 0, [RIGHT]: 0, [BOTTOM]: 0, [LEFT]: 0};
		this.vacanciesEdgesStatistics = {[TOP]: 0, [RIGHT]: 0, [BOTTOM]: 0, [LEFT]: 0};
	}

	getNextEdge(sizeRatio) {
		const sorter = (a, b) => this.edgesStatistics[a] - this.edgesStatistics[b];
		const edges = (sizeRatio === 1 ? edgesOrder : sizeRatio < 1 ? [RIGHT, LEFT] : [TOP, BOTTOM]).sort(sorter);
		const edge = edges[0];
		return edge;	
	}

  confirmEdgeUsage(usedEdge) {
    this.edgesStatistics[usedEdge]++;
	}

	getNextVacanciesEdge(spentEdges = []) {
		const sorter = (a, b) => {
			return this.vacanciesEdgesStatistics[a] - this.vacanciesEdgesStatistics[b];
		};
		const edges = edgesOrder.filter(edge => !spentEdges.includes(edge)).sort(sorter);
		if (!edges.length) {
			throw new Error('getNextVacanciesEdge error: edges is empty')
		}
		const edge = edges[0];
		this.vacanciesEdgesStatistics[edge]++;
		return edge;				
	}
}

export default EdgesManager;