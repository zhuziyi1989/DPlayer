import utils from './utils';
import Thumbnails from './thumbnails';
import Icons from './icons';

class Controller {
    constructor(player) {
        this.player = player;

        this.autoHideTimer = 0;
        if (!utils.isMobile) {
            this.player.container.addEventListener('mousemove', () => {
                this.setAutoHide();
            });
            this.player.container.addEventListener('click', () => {
                this.setAutoHide();
            });
            this.player.on('play', () => {
                this.setAutoHide();
            });
            this.player.on('pause', () => {
                this.setAutoHide();
            });
        }

        this.initPlayButton();
        this.initThumbnails();
        this.initPlayedBar();
        this.initFullButton();
        this.initQualityButton();
        this.initScreenshotButton();
        this.initSubtitleButton();
        this.initHighlights();
        this.initAirplayButton();
        if (!utils.isMobile) {
            this.initVolumeButton();
        }
    }

    initPlayButton() {
        this.player.template.playButton.addEventListener('click', () => {
            this.player.toggle();
        });

        this.player.template.mobilePlayButton.addEventListener('click', () => {
            this.player.toggle();
        });

        if (!utils.isMobile) {
            this.player.template.videoWrap.addEventListener('click', () => {
                this.player.toggle();
            });
            this.player.template.controllerMask.addEventListener('click', () => {
                this.player.toggle();
            });
        } else {
            this.player.template.videoWrap.addEventListener('click', () => {
                this.toggle();
            });
            this.player.template.controllerMask.addEventListener('click', () => {
                this.toggle();
            });
        }
    }
    // 初始化标记点
    initHighlights(optionsHighlight = this.player.options.highlight) {
        console.log(1);
        this.player.on('durationchange', () => {
            if (this.player.video.duration !== 1 && this.player.video.duration !== Infinity) {
                if (optionsHighlight) {
                    const highlights = document.querySelectorAll('.dplayer-highlight');
                    // const barWrap = document.querySelectorAll('.dplayer-bar-wrap');
                    [].slice.call(highlights, 0).forEach((item) => {
                        this.player.template.playedBarWrap.removeChild(item);
                    });
                    for (let i = 0; i < optionsHighlight.length; i++) {
                        if (!optionsHighlight[i].text || !optionsHighlight[i].time) {
                            continue;
                        }
                        const p = document.createElement('div');
                        p.classList.add('dplayer-highlight');
                        p.style.left = (optionsHighlight[i].time / this.player.video.duration) * 100 + '%';
                        if (optionsHighlight[i].imgageSrc) {
                            const imagesWidth = 160;
                            const inagesHeight = (this.player.video.videoHeight / this.player.video.videoWidth) * imagesWidth;
                            const barWidth = this.player.options.container.querySelector('.dplayer-bar-wrap').clientWidth;
                            const position = barWidth * (optionsHighlight[i].time / this.player.video.duration);
                            let marginLeft = 0;
                            if (position <= imagesWidth / 2) {
                                const cha = imagesWidth / 2 - position - 10;
                                marginLeft = cha;
                            } else if (barWidth - position <= imagesWidth / 2) {
                                const cha = -(imagesWidth / 2 - (barWidth - position) - 10);
                                marginLeft = cha;
                            }
                            p.innerHTML =
                                '<span class ="dplayer-highlight-images" style ="background-image: url(' +
                                optionsHighlight[i].imgageSrc +
                                ');margin-left:' +
                                marginLeft +
                                'px; width: ' +
                                imagesWidth +
                                'px; height: ' +
                                inagesHeight +
                                'px;"> <span class="dplayer-highlight-text-in" > ' +
                                optionsHighlight[i].text +
                                '</span > </span>';
                        } else {
                            p.innerHTML = '<span class="dplayer-highlight-text" > ' + optionsHighlight[i].text + '</span >';
                        }

                        this.player.template.playedBarWrap.insertBefore(p, this.player.template.playedBarTime);
                    }
                }
            }
        });
    }
    // 初始化缩略图
    initThumbnails() {
        if (this.player.options.video.thumbnails) {
            this.thumbnails = new Thumbnails({
                container: this.player.template.barPreview,
                barWidth: this.player.template.barWrap.offsetWidth,
                url: this.player.options.video.thumbnails,
                events: this.player.events,
            });

            this.player.on('loadedmetadata', () => {
                this.thumbnails.resize(160, (this.player.video.videoHeight / this.player.video.videoWidth) * 160, this.player.template.barWrap.offsetWidth);
            });
        }
    }

    initPlayedBar() {
        const thumbMove = (e) => {
            let percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            this.player.template.ptime.innerHTML = utils.secondToTime(percentage * this.player.video.duration);
        };

        const thumbUp = (e) => {
            document.removeEventListener(utils.nameMap.dragEnd, thumbUp);
            document.removeEventListener(utils.nameMap.dragMove, thumbMove);
            let percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            this.player.seek(this.player.bar.get('played') * this.player.video.duration);
            this.player.timer.enable('progress');
        };

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragStart, () => {
            this.player.timer.disable('progress');
            document.addEventListener(utils.nameMap.dragMove, thumbMove);
            document.addEventListener(utils.nameMap.dragEnd, thumbUp);
        });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragMove, (e) => {
            if (this.player.video.duration) {
                const px = this.player.template.playedBarWrap.getBoundingClientRect().left;
                const tx = (e.clientX || e.changedTouches[0].clientX) - px;
                if (tx < 0 || tx > this.player.template.playedBarWrap.offsetWidth) {
                    return;
                }
                const time = this.player.video.duration * (tx / this.player.template.playedBarWrap.offsetWidth);
                if (utils.isMobile) {
                    this.thumbnails && this.thumbnails.show();
                }
                this.thumbnails && this.thumbnails.move(tx);
                this.player.template.playedBarTime.style.left = `${tx - (time >= 3600 ? 25 : 20)}px`;
                this.player.template.playedBarTime.innerText = utils.secondToTime(time);
                this.player.template.playedBarTime.classList.remove('hidden');
            }
        });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragEnd, () => {
            if (utils.isMobile) {
                this.thumbnails && this.thumbnails.hide();
            }
        });

        if (!utils.isMobile) {
            this.player.template.playedBarWrap.addEventListener('mouseenter', () => {
                if (this.player.video.duration) {
                    this.thumbnails && this.thumbnails.show();
                    this.player.template.playedBarTime.classList.remove('hidden');
                }
            });

            this.player.template.playedBarWrap.addEventListener('mouseleave', () => {
                if (this.player.video.duration) {
                    this.thumbnails && this.thumbnails.hide();
                    this.player.template.playedBarTime.classList.add('hidden');
                }
            });
        }
    }

    initFullButton() {
        this.player.template.browserFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('browser');
        });

        this.player.template.webFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('web');
        });
    }

    initVolumeButton() {
        const vWidth = 35;

        const volumeMove = (event) => {
            const e = event || window.event;
            const percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        };
        const volumeUp = () => {
            document.removeEventListener(utils.nameMap.dragEnd, volumeUp);
            document.removeEventListener(utils.nameMap.dragMove, volumeMove);
            this.player.template.volumeButton.classList.remove('dplayer-volume-active');
        };

        this.player.template.volumeBarWrapWrap.addEventListener('click', (event) => {
            const e = event || window.event;
            const percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        });
        this.player.template.volumeBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
            document.addEventListener(utils.nameMap.dragMove, volumeMove);
            document.addEventListener(utils.nameMap.dragEnd, volumeUp);
            this.player.template.volumeButton.classList.add('dplayer-volume-active');
        });
        this.player.template.volumeButtonIcon.addEventListener('click', () => {
            if (this.player.video.muted) {
                this.player.video.muted = false;
                this.player.switchVolumeIcon();
                this.player.bar.set('volume', this.player.volume(), 'width');
            } else {
                this.player.video.muted = true;
                this.player.template.volumeIcon.innerHTML = Icons.volumeOff;
                this.player.bar.set('volume', 0, 'width');
            }
        });
    }

    initQualityButton() {
        if (this.player.options.video.quality) {
            this.player.template.qualityList.addEventListener('click', (e) => {
                if (e.target.classList.contains('dplayer-quality-item')) {
                    this.player.switchQuality(e.target.dataset.index);
                }
            });
        }
    }

    initScreenshotButton() {
        if (this.player.options.screenshot) {
            this.player.template.camareButton.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.player.video.videoWidth;
                canvas.height = this.player.video.videoHeight;
                canvas.getContext('2d').drawImage(this.player.video, 0, 0, canvas.width, canvas.height);

                let dataURL;
                canvas.toBlob((blob) => {
                    dataURL = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = `Screenshot.${utils.getFormatHMS(this.player.video.currentTime * 1000, true, true)}.png`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(dataURL);
                });

                this.player.events.trigger('screenshot', dataURL);
            });
        }
    }

    initAirplayButton() {
        if (this.player.options.airplay) {
            if (window.WebKitPlaybackTargetAvailabilityEvent) {
                this.player.video.addEventListener(
                    'webkitplaybacktargetavailabilitychanged',
                    function (event) {
                        switch (event.availability) {
                            case 'available':
                                this.template.airplayButton.disable = false;
                                break;

                            default:
                                this.template.airplayButton.disable = true;
                        }

                        this.template.airplayButton.addEventListener(
                            'click',
                            function () {
                                this.video.webkitShowPlaybackTargetPicker();
                            }.bind(this)
                        );
                    }.bind(this.player)
                );
            } else {
                this.player.template.airplayButton.style.display = 'none';
            }
        }
    }

    initSubtitleButton() {
        if (this.player.options.subtitle) {
            this.player.events.on('subtitle_show', () => {
                this.player.template.subtitleButton.dataset.balloon = this.player.tran('Hide subtitle');
                this.player.template.subtitleButtonInner.style.opacity = '';
                this.player.user.set('subtitle', 1);
            });
            this.player.events.on('subtitle_hide', () => {
                this.player.template.subtitleButton.dataset.balloon = this.player.tran('Show subtitle');
                this.player.template.subtitleButtonInner.style.opacity = '0.4';
                this.player.user.set('subtitle', 0);
            });

            this.player.template.subtitleButton.addEventListener('click', () => {
                this.player.subtitle.toggle();
            });
        }
    }

    setAutoHide() {
        this.show();
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = setTimeout(() => {
            if (this.player.video.played.length && !this.player.paused && !this.disableAutoHide) {
                this.hide();
            }
        }, 3000);
    }

    show() {
        this.player.container.classList.remove('dplayer-hide-controller');
    }

    hide() {
        this.player.container.classList.add('dplayer-hide-controller');
        this.player.setting.hide();
        this.player.comment && this.player.comment.hide();
    }

    isShow() {
        return !this.player.container.classList.contains('dplayer-hide-controller');
    }

    toggle() {
        if (this.isShow()) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        clearTimeout(this.autoHideTimer);
    }
}

export default Controller;
