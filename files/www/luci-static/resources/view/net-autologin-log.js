'use strict';
'require view';
'require fs';
'require poll';
'require @ASSET_PATH@.layout as layout';

var DEFAULT_LIMIT = '100';

function readLogs(level, limit) {
	return fs.exec('/usr/libexec/net-autologin-log', [level, limit]).then(function(result) {
		return result.code === 0 ? (result.stdout || '').trimEnd() : null;
	}).catch(function() {
		return null;
	});
}

return view.extend({
	load: function() {
		return Promise.all([readLogs('all', DEFAULT_LIMIT), layout.loadStatus()]);
	},

	render: function(data) {
		var level = E('select', { 'class': 'cbi-input-select', 'id': 'net-autologin-log-level' }, [
			E('option', { 'value': 'all' }, _('全部')),
			E('option', { 'value': 'info' }, _('信息')),
			E('option', { 'value': 'warn' }, _('警告')),
			E('option', { 'value': 'err' }, _('错误'))
		]);
		var limit = E('select', { 'class': 'cbi-input-select', 'id': 'net-autologin-log-limit' },
			['25', '50', '100', '200'].map(function(count) {
				return E('option', { 'value': count }, count);
			}));
		limit.value = DEFAULT_LIMIT;

		var output = E('textarea', {
			'class': 'cbi-input-textarea',
			'aria-label': _('网络自动登录日志'),
			'readonly': '',
			'wrap': 'soft',
			'rows': 20
		});
		var status = E('p', { 'class': 'net-autologin-log-message', 'role': 'status' });
		var loaded = false;
		var pending = null;

		function update(text) {
			var message = '';

			if (text === null) {
				message = _('暂时无法读取日志，稍后自动重试。');
			} else {
				if (!text)
					message = _('没有符合条件的日志。');

				if (text !== output.value || !loaded) {
					var follow = !loaded || output.scrollHeight - output.scrollTop - output.clientHeight <= 2;
					output.value = text;
					if (follow)
						output.scrollTop = output.scrollHeight;
				}
				loaded = output.isConnected;
			}

			if (status.textContent !== message)
				status.textContent = message;
		}

		function refresh() {
			if (!output.isConnected) {
				poll.remove(refresh);
				return;
			}

			if (pending)
				return pending;

			var selectedLevel = level.value;
			var selectedLimit = limit.value;
			pending = readLogs(selectedLevel, selectedLimit).then(function(text) {
				pending = null;
				if (selectedLevel !== level.value || selectedLimit !== limit.value)
					refresh();
				else if (output.isConnected)
					update(text);
			});
			return pending;
		}

		function changeFilter() {
			output.value = '';
			loaded = false;
			status.textContent = _('正在读取日志…');
			refresh();
		}

		level.addEventListener('change', changeFilter);
		limit.addEventListener('change', changeFilter);
		update(data[0]);
		window.setTimeout(function() {
			if (output.isConnected)
				poll.add(refresh, 5);
		}, 0);

		return layout.page('logs', E('section', { 'class': 'net-autologin-logs', 'aria-label': _('运行日志') }, [
			E('div', { 'class': 'net-autologin-filters' }, [
				E('div', {}, [
					E('label', { 'for': 'net-autologin-log-level' }, _('显示级别')),
					level
				]),
				E('div', {}, [
					E('label', { 'for': 'net-autologin-log-limit' }, _('显示条数')),
					limit
				])
			]),
			output,
			status
		]), data[1]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
