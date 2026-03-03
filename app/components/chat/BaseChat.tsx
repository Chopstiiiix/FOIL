import type { Message } from 'ai';
import React, { type RefCallback, useEffect, useState, useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { toast } from 'react-toastify';
import { Menu } from '~/components/sidebar/Menu.client';
import { Workbench } from '~/components/workbench/Workbench.client';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { showGitHubDialog } from '~/lib/stores/github';
import { showVercelDialog } from '~/lib/stores/vercel';
import { showImportDialog } from '~/lib/stores/github-import';
import { GitHubDeployDialog } from '~/components/github/GitHubDeployDialog.client';
import { VercelDeployDialog } from '~/components/vercel/VercelDeployDialog.client';
import { GitHubImportDialog } from '~/components/github/GitHubImportDialog.client';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';

import styles from './BaseChat.module.scss';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI' },
  { text: 'Make a space invaders game' },
  { text: 'How do I center a div?' },
];

const PLACEHOLDER_SUGGESTIONS = [
  'Build a personal portfolio website',
  'Create an interactive quiz app',
  'Make a weather dashboard with API integration',
  'Build a real-time chat application',
  'Design a landing page for a startup',
  'Create an e-commerce product page',
  'Build a markdown note-taking app',
  'Make a kanban board like Trello',
];

const TYPING_SPEED = 40;
const ERASING_SPEED = 25;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_ERASING = 500;

function useTypingPlaceholder(active: boolean) {
  const [displayedText, setDisplayedText] = useState('');

  const animate = useCallback(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isTyping = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    function tick() {
      const currentText = PLACEHOLDER_SUGGESTIONS[currentIndex];

      if (isTyping) {
        if (charIndex <= currentText.length) {
          setDisplayedText(currentText.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(tick, TYPING_SPEED);
        } else {
          isTyping = false;
          timeoutId = setTimeout(tick, PAUSE_AFTER_TYPING);
        }
      } else {
        if (charIndex > 0) {
          charIndex--;
          setDisplayedText(currentText.slice(0, charIndex));
          timeoutId = setTimeout(tick, ERASING_SPEED);
        } else {
          isTyping = true;
          currentIndex = (currentIndex + 1) % PLACEHOLDER_SUGGESTIONS.length;
          timeoutId = setTimeout(tick, PAUSE_AFTER_ERASING);
        }
      }
    }

    tick();

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!active) {
      setDisplayedText('');
      return;
    }

    return animate();
  }, [active, animate]);

  return displayedText;
}

const TEXTAREA_MIN_HEIGHT = 117;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const typingPlaceholder = useTypingPlaceholder(!chatStarted && input.length === 0);

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-foil-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[26vh] max-w-chat mx-auto">
                <p className="mb-4 text-center text-foil-elements-textSecondary">
                  Bring ideas to life in seconds or get help on existing projects
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative w-full max-w-chat mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <div
                  className={classNames(
                    'shadow-sm border border-foil-elements-borderColor bg-foil-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-3 pb-3 pr-16 focus:outline-none resize-none text-sm text-foil-elements-textPrimary placeholder-foil-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder={typingPlaceholder}
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                </div>
                {!chatStarted && (
                  <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" shape="circle" onClick={() => showGitHubDialog.set(true)}>
                      <div className="i-ph:github-logo" />
                      GitHub
                    </Button>
                    <Button variant="outline" size="sm" shape="circle" onClick={() => showVercelDialog.set(true)}>
                      <div className="i-ph:rocket-launch" />
                      Vercel
                    </Button>
                    <Button variant="outline" size="sm" shape="circle" onClick={() => showImportDialog.set(true)}>
                      <div className="i-ph:download-simple" />
                      Import
                    </Button>
                    <Button variant="outline" size="sm" shape="circle" onClick={() => toast.info('Start a conversation first to use the terminal')}>
                      <div className="i-ph:terminal" />
                      Terminal
                    </Button>
                  </div>
                )}
                <ClientOnly>
                  {() => (
                    <>
                      <GitHubDeployDialog />
                      <VercelDeployDialog />
                      <GitHubImportDialog />
                    </>
                  )}
                </ClientOnly>
                <div className="bg-foil-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
              </div>
            </div>
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);
