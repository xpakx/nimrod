export class Logger {
	level: LoggerLevel;
	format: LoggerFormat;
	transports: LoggerTransport[];
	levels: { [key: string]: number };
	className: string;
	disabled: boolean = false;

	constructor(source: string, options: LoggerOptions = {}) {
			this.level = options.level || 'info';
			this.format = options.format || 'plain';
			this.transports = options.transports || [new ConsoleTransport()];
			this.className = source;

			this.levels = {
				"debug": 0,
				"info": 1,
				"warn": 2,
				"error": 3,
			};
	}

	log(level: LoggerLevel, message: string, context = undefined) {
		if (this.disabled) return;
		if (this.levels[level] >= this.levels[this.level]) {
			const formattedMessage = this.formatMessage(level, message, context);
			this.transports.forEach(transport => transport.log(formattedMessage, level, context));
		}
	}

	formatMessage(level: LoggerLevel, message: string, context: any) {
		const timestamp = new Date().toISOString();
		switch (this.format) {
			case 'json':
				const className = this.className;
				return JSON.stringify({ timestamp, level, className, message, ...context });
			case 'plain':
			default:
				return `[${timestamp}] [${level.toUpperCase()}] ${this.className}: ${message}`;
		}
	}

	formatPosition(position?: {x: number, y: number}): string {
		if (!position) {
			return "undefined";
		}
		return `(${position.x}, ${position.y})`;
	}

	debug(message: string, context: any = undefined) {
		this.log('debug', message, context);
	}

	info(message: string, context: any = undefined) {
		this.log('info', message, context);
	}

	warn(message: string, context: any = undefined) {
		this.log('warn', message, context);
	}

	error(message: string, context: any = undefined) {
		this.log('error', message, context);
	}
}

export type LoggerLevel = 'info' | 'debug' | 'warn' | 'error';
export type LoggerFormat = 'plain' | 'json';

export interface LoggerOptions {
	level?: LoggerLevel;
	format?: LoggerFormat;
	transports?: LoggerTransport[];
}

export abstract class LoggerTransport {
	abstract log(message: string, level: LoggerLevel, context: any): void;
}

export class ConsoleTransport extends LoggerTransport {
	styles = {
		debug: 'color: cyan;',       // Cyan
		info: 'color: green;',       // Green
		warn: 'color: orange;',      // Orange
		error: 'color: red;',        // Red
		reset: 'color: inherit;',    // Reset to default
	};

	log(message: string, level: LoggerLevel, context: any) {
		if (context !== undefined) {
			console.groupCollapsed(`%c ${message}`, this.styles[level]);
			console.log(context);
			console.groupEnd();
		} else {
			console.log(`%c ${message}`, this.styles[level]);
		}
	}
}

export class LoggerFactory {
	static loggers: {[key: string]: Logger} = {};
	static globalLevel: LoggerLevel = "error";
	static enabledList?: string[];
	static disabledList?: string[];

	static getLogger(source: string, instanceOptions: LoggerOptions = {}): Logger {
		let options: LoggerOptions = {
			level: this.globalLevel,
		}
		if (source in this.loggers) {
			// TODO error if options not empty
			return this.loggers[source];
		}
		if ("transports" in instanceOptions) options.transports = instanceOptions.transports;
		if ("format" in instanceOptions) options.format = instanceOptions.format;
		let newLogger = new Logger(source, options);
		this.loggers[source] = newLogger;
		newLogger.disabled = this.checkDisable(source);
		return this.loggers[source];
	}

	static updateAllLevels(level: LoggerLevel) {
		this.globalLevel = level;
		for (let logger in this.loggers) {
			this.loggers[logger].level = level;
		}
	}

	static updateLevels(level: LoggerLevel, sources: string[]) {
		for (let key of sources) {
			if (key in this.loggers) {
				this.loggers[key].level = level;
			}
		}
	}

	static checkDisable(source: string): boolean {
		if (this.enabledList) return !this.enabledList.includes(source);
		if (this.disabledList) return this.disabledList.includes(source);
		return false;
	}

	static enable(sources: string[]) {
		for (let loggerName in this.loggers) {
			const inSources = sources.includes(loggerName);
			const logger = this.loggers[loggerName];
			logger.disabled = !inSources;
		}
		this.enabledList = sources;
		this.disabledList = undefined;
	}

	static disable(sources: string[]) {
		for (let loggerName in this.loggers) {
			const inSources = sources.includes(loggerName);
			const logger = this.loggers[loggerName];
			logger.disabled = inSources;
		}
		this.enabledList = undefined;
		this.disabledList = sources;
	}
}
