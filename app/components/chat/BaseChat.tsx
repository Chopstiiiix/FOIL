import type { Message } from 'ai';
import React, { type RefCallback, useEffect, useState, useCallback, useRef } from 'react';
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
import { HowItWorksDialog, showHowItWorksDialog } from '~/components/chat/HowItWorksDialog.client';
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

interface AttachedFile {
  name: string;
  content: string;
  mimeType: string;
  size: number;
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

    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      files.forEach((file) => {
        const reader = new FileReader();

        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file, 'utf-8');
        }

        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            { name: file.name, content: reader.result as string, mimeType: file.type, size: file.size },
          ]);
        };
      });

      event.target.value = '';
    };

    const removeAttachedFile = (index: number) => {
      setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = (event: React.UIEvent) => {
      if (attachedFiles.length > 0 && !isStreaming) {
        const fileContext = attachedFiles
          .map((f) => {
            if (f.mimeType.startsWith('image/')) {
              return `[Attached image: ${f.name}]`;
            }

            return `<file name="${f.name}">\n${f.content}\n</file>`;
          })
          .join('\n\n');

        const combinedInput = input ? `${fileContext}\n\n${input}` : fileContext;

        sendMessage?.(event, combinedInput);
        setAttachedFiles([]);
      } else {
        sendMessage?.(event);
      }
    };

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
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-foil-elements-borderColor">
                      {attachedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-transparent text-white/70 rounded-full px-2 py-0.5 text-xs max-w-[200px] border border-white/10"
                        >
                          <div className={file.mimeType.startsWith('image/') ? 'i-ph:image' : 'i-ph:file-text'} />
                          <span className="truncate">{file.name}</span>
                          <button
                            className="flex-shrink-0 hover:text-white ml-0.5 transition-colors duration-300"
                            onClick={() => removeAttachedFile(index)}
                          >
                            <div className="i-ph:x text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-3 pb-10 pr-16 focus:outline-none resize-none text-sm text-foil-elements-textPrimary placeholder-foil-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        handleSend(event);
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
                        show={input.length > 0 || isStreaming || attachedFiles.length > 0}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          handleSend(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".txt,.md,.markdown,.csv,.json,.xml,.yaml,.yml,.toml,.ini,.env,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.cs,.php,.swift,.kt,.scala,.sh,.bash,.zsh,.html,.htm,.css,.scss,.sass,.less,.png,.jpg,.jpeg,.gif,.webp,.svg"
                    onChange={handleFileSelect}
                  />
                  <button
                    className="absolute bottom-[10px] left-[10px] flex items-center justify-center w-7 h-7 rounded-full bg-transparent border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-300"
                    title="Attach files"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="i-ph:paperclip text-lg" />
                  </button>
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
                    <Button variant="outline" size="sm" shape="circle" onClick={() => showHowItWorksDialog.set(true)}>
                      <div className="i-ph:question" />
                      How it works
                    </Button>
                  </div>
                )}
                <ClientOnly>
                  {() => (
                    <>
                      <GitHubDeployDialog />
                      <VercelDeployDialog />
                      <GitHubImportDialog />
                      <HowItWorksDialog />
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
