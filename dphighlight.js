var instance_skel = require('../../instance_skel');
var udp           = require('../../udp');
var tcp			  = require('../../tcp');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.socket = new tcp(self.config.host, 7000);

	self.socket.on('error', (err) => {
		debug("Network error", err);
		self.log('error',"Network error: " + err.message);
	});

	self.socket.on('connect', () => {
		debug("Connected");
		self.status(self.STATUS_OK);
	});
}

instance.prototype.init_udp = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, 7000);

		self.udp.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	if (self.config.protocol === 'tcp') {
		self.init_tcp();
	}
	else {
		self.init_udp();
	}
};

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.config = config;

	if (self.config.host !== undefined) {
		if (self.config.protocol === 'tcp') {
			self.init_tcp();
		}
		else {
			self.init_udp();
		}
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'dropdown',
			id: 'protocol',
			label: 'UDP or TCP',
			default: 'UDP',
			choices: [
				{ id: 'udp', label: 'UDP'},
				{ id: 'tcp', label: 'TCP'}
			]
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.config.protocol === 'tcp') {
		if (self.socket !== undefined) {
			self.socket.destroy();
		}
	}
	else {
		if (self.udp !== undefined) {
			self.udp.destroy();
		}
	}
	debug("destroy", self.id);
};

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'powerOn':        { label: 'Power On Projector' },
		'powerOff':       { label: 'Power Off Projector' },
		'shutterOpen':    { label: 'Open Shutter' },
		'shutterClose':   { label: 'Close Shutter' },
		'freeze':         { label: 'Freeze Input' },
		'unfreeze':       { label: 'Unfreeze Input' },
		'bright+':        { label: 'Increase Brightness' },
		'bright-':        { label: 'Decrease Brightness' },
		'cont+':          { label: 'Increase Contrast' },
		'cont-':          { label: 'Decrease Contrast' },
		'sat+':           { label: 'Increase Saturation' },
		'sat-':           { label: 'Decrease Saturation' }
	});
};

instance.prototype.action = function(action) {
	var self = this;
	var id = action.action;

	// dphl port 7000
	var dphl = {
		'powerOn':       '*power = 1 \r',
		'powerOff':      '*power = 0 \r',
		'shutterOpen':   '*shutter = 1 \r',
		'shutterClose':  '*shutter = 0 \r',
		'freeze':        '*freeze = 1 \r',
		'unfreeze':      '*freeze = 0 \r',
		'bright+':       '*brightness + \r',
		'bright-':       '*brightness - \r',
		'cont+':         '*contrast + \r',
		'cont-':         '*contrast - \r',
		'sat+':          '*saturation + \r',
		'sat-':          '*saturation - \r'
	};

	if (dphl[id] !== undefined) {
		debug('sending',dphl[id],"to",self.config.host);

		if (self.config.protocol === 'tcp') {
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(dphl[id]);
			}
		}
		else {
			if (self.udp !== undefined) {
				self.udp.send(dphl[id]);
			}
		}
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
