'use strict';
'require baseclass';
'require fs';
'require poll';
'require uci';

var STATUS_FILE = '/var/run/net-autologin.status';
var STATES = {
	invalid_config: { label: _('配置有误'), detail: _('请检查上联接口、认证参数和检测间隔。'), tone: 'error' },
	credentials_required: { label: _('待填写账号'), detail: _('请在基本设置中填写账号和密码。'), tone: 'pending' },
	waiting_wan: { label: _('等待上联'), detail: _('等待所选接口获得 IPv4 地址。'), tone: 'pending' },
	waiting_mac: { label: _('等待上联'), detail: _('等待所选接口提供 MAC 地址。'), tone: 'pending' },
	online: { label: _('已联网'), detail: _('联网检测已收到 HTTP 204 响应。'), tone: 'online' },
	login_sent: { label: _('已提交认证'), detail: _('等待联网检测确认认证结果。'), tone: 'pending' },
	login_failed: { label: _('认证失败'), detail: _('服务会按设定的间隔自动重试。'), tone: 'error' },
	starting: { label: _('等待服务启动'), detail: _('服务启动后会开始检测上联接口。'), tone: 'pending' },
	disabled: { label: _('已停用'), detail: _('启用自动登录后，点击保存并应用。'), tone: 'idle' }
};

function readStatus() {
	return L.resolveDefault(fs.read(STATUS_FILE), '').then(function(value) {
		return value.trim();
	});
}

function pageLink(name, current, title) {
	return E('a', {
		'href': L.url('admin', 'services', 'net-autologin', name),
		'aria-current': name === current ? 'page' : null
	}, title);
}

return baseclass.extend({
	loadStatus: function() {
		return Promise.all([uci.load('net-autologin'), readStatus()]).then(function(data) {
			return data[1];
		});
	},

	page: function(current, content, initialStatus, detail) {
		var styleId = 'net-autologin-ui-style';
		if (!document.getElementById(styleId)) {
			document.head.appendChild(E('link', {
				'id': styleId,
				'rel': 'stylesheet',
				'href': L.resource('@ASSET_PATH@', 'style.css')
			}));
		}

		var badge = E('span', { 'class': 'net-autologin-badge' });
		var currentState;
		var page = E('div', { 'class': 'net-autologin-page' }, [
			E('div', { 'class': 'net-autologin-heading' }, [
				E('div', { 'class': 'net-autologin-identity' }, [
					E('h2', {}, _('网络自动登录')),
					E('span', { 'class': 'net-autologin-version' }, _('版本') + ' @PACKAGE_VERSION@'),
					E('span', { 'role': 'status', 'aria-label': _('连接状态') }, badge)
				]),
				E('nav', { 'class': 'net-autologin-nav', 'aria-label': _('网络自动登录页面') }, [
					pageLink('settings', current, _('设置')),
					pageLink('logs', current, _('运行日志'))
				])
			]),
			content
		]);

		function showStatus(state) {
			var nextState = Object.prototype.hasOwnProperty.call(STATES, state) ? state :
				(uci.get('net-autologin', 'main', 'enabled') === '1' ? 'starting' : 'disabled');
			if (nextState === currentState)
				return;

			currentState = nextState;
			var info = STATES[nextState];
			badge.textContent = info.label;
			badge.dataset.tone = info.tone;
			if (detail)
				detail.textContent = info.detail;
		}

		function refreshStatus() {
			if (!page.isConnected) {
				poll.remove(refreshStatus);
				return;
			}
			return readStatus().then(showStatus);
		}

		showStatus(initialStatus);
		window.setTimeout(function() {
			if (page.isConnected)
				poll.add(refreshStatus, 5);
		}, 0);
		return page;
	}
});
