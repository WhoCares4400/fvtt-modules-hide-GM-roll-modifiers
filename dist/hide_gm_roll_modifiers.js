class HideGMRollModifiers {
	static init() {
		game.settings.register('hide-gm-roll-modifiers', 'sanitize-rolls', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-rolls.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'sanitize-damage-rolls', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-damage-rolls.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-damage-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'sanitize-dice-so-nice', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-dice-so-nice.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-dice-so-nice.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'sanitize-crit-fail', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-crit-fail.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-crit-fail.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'sanitize-better-rolls-crit-dmg', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-better-rolls-crit-dmg.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-better-rolls-crit-dmg.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'sanitize-ready-set-roll-crit-dmg', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-ready-set-roll-crit-dmg.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.sanitize-ready-set-roll-crit-dmg.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'hide-private-rolls', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-private-rolls.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-private-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: true,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'hide-player-rolls', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-player-rolls.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-player-rolls.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: false,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'hide-item-description', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-item-description.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.hide-item-description.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: false,
			type: Boolean,
		});

		game.settings.register('hide-gm-roll-modifiers', 'private-hidden-tokens', {
			name: game.i18n.localize('hide-gm-roll-modifiers.settings.private-hidden-tokens.name'),
			hint: game.i18n.localize('hide-gm-roll-modifiers.settings.private-hidden-tokens.hint'),
			scope: 'world',
			config: true,
			restricted: true,
			default: false,
			type: Boolean,
		});
	}

	static ready() {
		if (!game.modules.get('lib-wrapper')?.active) {
			if (game.user.isGM) {
				ui.notifications.error(
					"Module hide-gm-roll-modifiers requires the 'lib-wrapper' module. Please install and activate it.",
				);
			}
			return;
		}

		libWrapper.register(
			'hide-gm-roll-modifiers',
			'ChatLog.prototype.notify',
			(wrapped, ...args) => {
				if (args.length < 1) {
					wrapped(...args);
					return;
				}
				if (this.shouldHide(args[0])) {
					return;
				}
				wrapped(...args);
			},
			'MIXED',
		);
	}

	static isGMMessage(msg) {
		return game.user.isGM || (msg.author && !msg.author.isGM) || (!msg.author && !msg.user?.isGM);
	}

	static isPlayerMessage(msg) {
		return msg.author?.id === game.user.id || (!msg.author && msg.user?.id == game.user.id);
	}

	static isDamageRoll(msg) {
		// dnd5e 3.x flag
		const rollType = msg.flags?.dnd5e?.roll?.type;
		if (rollType === 'damage') return true;
		if (rollType && rollType !== 'damage') return false;

		// Generic fallback: rolls that contain only non-d20 dice are treated as damage rolls
		const rolls = msg.rolls ?? [];
		if (rolls.length === 0) return false;
		const hasDice = rolls.some(r => r.dice?.length > 0);
		const hasD20 = rolls.some(r => r.dice?.some(d => d.faces === 20));
		return hasDice && !hasD20;
	}

	static shouldHide(msg) {
		if (
			!game.settings.get('hide-gm-roll-modifiers', 'hide-private-rolls') &&
			!game.settings.get('hide-gm-roll-modifiers', 'hide-player-rolls')
		)
			return false;

		// Skip if we have an empty msg
		if (!msg) {
			return false;
		}

		// Skip processing if we're a GM, or the message did not originate from one.
		if (this.isGMMessage(msg) && !game.settings.get('hide-gm-roll-modifiers', 'hide-player-rolls')) {
			return false;
		}

		const whisper = msg.whisper || msg.message?.whisper || msg.data?.whisper || msg.message?.data?.whisper;
		// Skip if this message is not a whisper
		if (!whisper) {
			return false;
		}
		// Skip if message was whispered to the current user.
		if (whisper.length === 0 || whisper.includes(game.user.id || game.user._id)) {
			return false;
		}

		// Skip if this player originated the message
		if (game.settings.get('hide-gm-roll-modifiers', 'hide-player-rolls') && this.isPlayerMessage(msg)) {
			return false;
		}

		return true;
	}

	static hideRoll(app, html, msg) {
		if (!this.shouldHide(msg)) {
			return;
		}

		if (app.sound) {
			app.sound = null;
		}
		html.classList.add('gm-roll-hidden');
		html.style.display = 'none';
	}

	static _sanitizeCrits(html) {
		if (!game.settings.get('hide-gm-roll-modifiers', 'sanitize-crit-fail')) {
			return;
		}
		html.querySelectorAll('h4.dice-total').forEach(el => {
			el.classList.remove('critical');
			el.classList.remove('fumble');
		});
	}

	static _sanitizeBetterRolls5e(html) {
		if (!game.modules.get('betterrolls5e')?.active) {
			return;
		}
		if (game.settings.get('hide-gm-roll-modifiers', 'sanitize-crit-fail')) {
			html.querySelectorAll('.success').forEach(el => el.classList.remove('success'));
			html.querySelectorAll('.failure').forEach(el => el.classList.remove('failure'));
			html.querySelectorAll('.flavor-text.inline').forEach(el => el.remove());
		}

		html.querySelectorAll('.dice-total .die-icon').forEach(el => el.remove());

		if (game.settings.get('hide-gm-roll-modifiers', 'sanitize-better-rolls-crit-dmg')) {
			html.querySelectorAll('.dice-total.red-damage').forEach(total => {
				const base = total.querySelector('.red-base-damage');
				const crit = total.querySelector('.red-crit-damage');
				if (!base || !crit) return;
				const sum = parseInt(base.dataset.value) + parseInt(crit.dataset.value);
				total.innerHTML = '';
				total.textContent = sum;
			});
		}
	}

	static _sanitizeReadySetRoll5e(html) {
		if (!game.modules.get('ready-set-roll-5e')?.active) {
			return;
		}

		if (game.settings.get('hide-gm-roll-modifiers', 'sanitize-crit-fail')) {
			html.querySelectorAll('.success').forEach(el => el.classList.remove('success'));
			html.querySelectorAll('.failure').forEach(el => el.classList.remove('failure'));
		}

		html.querySelectorAll('.dice-total .die-icon').forEach(el => el.remove());

		if (game.settings.get('hide-gm-roll-modifiers', 'sanitize-ready-set-roll-crit-dmg')) {
			const crits = [...html.querySelectorAll('.rsr-damage > .rsr-crit-damage')];
			if (crits.length === 0) return;
			crits.forEach(crit => {
				const total = crit.parentElement;
				const base = total.querySelector('.rsr-base-damage');
				if (!base) {
					return;
				}
				const label = total.querySelector('.rsr5e-roll-label');
				if (label) {
					label.remove();
				}
				const sum = parseInt(base.dataset.value) + parseInt(crit.dataset.value);
				base.dataset.value = sum;
				base.textContent = sum;
				total.replaceChildren(base);
			});
		}
	}

	static _sanitizePF2e(html) {
		if (game.system.id !== 'pf2e') {
			return;
		}
		html.querySelectorAll('.flavor-text div.tags').forEach(el => el.remove());
		html.querySelectorAll('.flavor-text span.damage-tag').forEach(el => el.remove());
	}

	static sanitizeRoll(html, msg) {
		const sanitizeRolls = game.settings.get('hide-gm-roll-modifiers', 'sanitize-rolls');
		const sanitizeDamage = game.settings.get('hide-gm-roll-modifiers', 'sanitize-damage-rolls');

		if (!sanitizeRolls && !sanitizeDamage) return;

		// Skip processing if we're a GM, or the message did not originate from one.
		if (this.isGMMessage(msg)) {
			return;
		}

		const isDmg = this.isDamageRoll(msg);
		if (isDmg && !sanitizeDamage) return;
		if (!isDmg && !sanitizeRolls) return;

		if (isDmg) {
			console.log(html, msg, html.querySelectorAll('.dice-roll'));
		}

		html.querySelectorAll('.dice-formula').forEach(el => el.remove());
		html.querySelectorAll('.dice-tooltip').forEach(el => el.remove());
		html.classList.add('gm-roll-modifier-hidden', 'gm-roll-chevron-hidden');

		this._sanitizeCrits(html);
		this._sanitizeBetterRolls5e(html);
		this._sanitizeReadySetRoll5e(html);
		this._sanitizePF2e(html);
	}

	static sanitizeCard(html, msg) {
		if (this.isGMMessage(msg)) return;
		if (game.settings.get('hide-gm-roll-modifiers', 'hide-item-description')) {
			html.querySelectorAll('div.item-card div.card-content').forEach(el => {
				el.innerHTML = '';
				el.classList.add('gm-roll-hidden');
			});
			html.querySelectorAll('div.chat-card section.card-header.description section.details.card-content').forEach(el => {
				el.innerHTML = '';
				el.classList.add('gm-roll-hidden');
			});
			html.querySelectorAll('div.chat-card section.card-header.description header.summary').forEach(summary => {
				const icons = summary.querySelectorAll('i');
				if (icons.length > 0) icons[icons.length - 1].remove();
			});
		}
	}

	static mangleRoll(doc) {
		if (game.settings.get('hide-gm-roll-modifiers', 'private-hidden-tokens')) {
			// Skip processing unless we're a GM
			if (!game.user?.isGM) {
				return;
			}
			// Skip processing if the roll is already private
			const whisper = doc.whisper || doc.data?.whisper;
			if (whisper && whisper.length > 0) {
				return;
			}

			const tokenId = doc.speaker?.token;
			if (tokenId) {
				const token = game.canvas.tokens.get(tokenId);
				if (token?.document?.hidden) {
					doc.applyRollMode(CONST.DICE_ROLL_MODES.PRIVATE);
				}
			}
		}
	}
}

Hooks.on('init', () => {
	HideGMRollModifiers.init();
});

Hooks.on('ready', () => {
	HideGMRollModifiers.ready();
});

Hooks.on('preCreateChatMessage', (doc, _data, _options) => {
	HideGMRollModifiers.mangleRoll(doc)
});

// renderChatMessageHTML fires after all system/module enrichment (Foundry v13+)
// html is a plain HTMLElement here, not a jQuery object
Hooks.on('renderChatMessageHTML', (app, html, _data) => {
	HideGMRollModifiers.hideRoll(app, html, app);
	HideGMRollModifiers.sanitizeRoll(html, app);
	HideGMRollModifiers.sanitizeCard(html, app);
});

Hooks.on('updateChatMessage', (msg, _data, _diff, _userId) => {
	if (
		!game.settings.get('hide-gm-roll-modifiers', 'sanitize-rolls') &&
		!game.settings.get('hide-gm-roll-modifiers', 'sanitize-damage-rolls') &&
		!game.settings.get('hide-gm-roll-modifiers', 'hide-item-description')
	) {
		return;
	}

	const html = document.querySelector(`.chat-log li.message[data-message-id="${msg.id}"]`);
	if (!html) return;
	HideGMRollModifiers.sanitizeRoll(html, msg);
	HideGMRollModifiers.sanitizeCard(html, msg);
});

Hooks.on('diceSoNiceRollStart', (_, context) => {
	if (game.settings.get('hide-gm-roll-modifiers', 'sanitize-dice-so-nice')) {
		// Skip processing if we're a GM, or the message did not originate from one.
		if (game.user.isGM || (context.user && !context.user.isGM)) {
			return true;
		}
		context.blind = true;
	}
});
