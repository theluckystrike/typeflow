import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import Badges from "../components/Badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Button } from "../components/ui/button";
import { CheckCheckIcon, CheckCircle, CheckIcon, Edit2Icon, EraserIcon, InfoIcon, ToggleLeftIcon, ToggleRightIcon, TrashIcon } from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { userUser } from "./hooks/useUser";
import { useSettings } from "./hooks/useSettings";
import { useCustomShortcuts } from "./hooks/useCustomShortcut";
import { useFixedShortcuts } from "./hooks/useFixedShortcut";
import { LoadingProgress } from "../components/Progress";
import LoadingScreen from "../components/LoadingScreen";
import { useConstants } from "./hooks/useConstants";
import { processEventCode } from "../utils/keys";
import { deleteCache } from "../utils/cache";
import { useProfiles } from "./hooks/useProfiles";

const SidePanel = () => {
  const [showAddInput, setShowAddInput] = React.useState(false);
  const [pressedKey, setPressedKey] = React.useState('');
  const [canTakeKeyboardInput, setCanTakeKeyboardInput] = React.useState(false);
  const [customInstruction, setCustomInstruction] = React.useState('');
  const [editID, setEditID] = React.useState<string | null>(null);
  const [editError, setEditError] = React.useState<string | null>(null);

  const { user, getUser, loading: userLoading, error: userError } = userUser();
  const { settings, getSettings, updateSettings } = useSettings();
  const { customShortcuts, editShortcut, getCustomShortcuts, updateCustomShortcuts, getShortcut, createCustomShortcut, updateCustomShortcut, deleteCustomShortcut, loading: customShortcutLoading, error: customShortcutError, success: customShortcutSuccess } = useCustomShortcuts();
  const { fixedShortcuts, getFixedShortcuts, updateFixedShortcuts, loading: fixedShortcutLoading, error: fixedShortcutError, success: fixedShortcutSuccess, } = useFixedShortcuts();
  const { languages, tones, writingStyles, getConstants } = useConstants();
  const { loading: profilesLoading, profile, profiles, getProfile, getProfiles, updateProfile } = useProfiles();

  useEffect(() => {
    getUser();
    getSettings();
    getCustomShortcuts();
    getFixedShortcuts();
    getConstants();
    getProfiles();
    getProfile();
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'fetchShortcuts' });
  }, [customShortcutSuccess, fixedShortcutSuccess, profile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canTakeKeyboardInput) return;
      setPressedKey((prevKey) => `${prevKey}${prevKey ? '+' : ''}${processEventCode(event.code)}`);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canTakeKeyboardInput]);

  function containsDuplicate(arr: string[]) {
    return new Set(arr).size !== arr.length;
  }

  useEffect(() => {
    if (pressedKey.length > 0) {
      if (pressedKey.split("+")[0].length <= 1) {
        setEditError('Invalid Start Key');
        setPressedKey('');
        setTimeout(() => {
          setEditError(null);
        }, 2000);
      } else if (pressedKey.split("+").length > 3) {
        setEditError('Key combination can not be more than 3');
        setPressedKey(pressedKey.split("+").slice(0, 3).join("+"));
        setTimeout(() => {
          setEditError(null);
        }, 2000);
      } else if (containsDuplicate(pressedKey.split("+"))) {
        setEditError('Duplicate Key');
        setPressedKey(pressedKey.split("+").filter((value, index, self) => self.indexOf(value) === index).join("+"));
        setTimeout(() => {
          setEditError(null);
        }, 2000);
      }
    }
  }, [pressedKey]);

  useEffect(() => {
    setPressedKey('');
    setCanTakeKeyboardInput(false);
    setShowAddInput(false);
  }, [customShortcutSuccess]);

  function updateShortcut() {
    updateCustomShortcut(editID as string, {
      shortcut_id: editID,
      shortcut_keys: pressedKey,
      prompt: customInstruction,
    });
    setPressedKey('');
    setCanTakeKeyboardInput(false);
    setShowAddInput(false);
    setEditID(null);
  };

  const messageListener = (message: any, sender: any, sendResponse: any) => {
    if (message.type === 'closeSidePanel') {
      window.close();
    } else if (message.type === 'fetchShortcutsResponse') {
      updateCustomShortcuts(message.customShortcuts);
      updateFixedShortcuts(message.fixedShortcuts);
    };
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);


  if (userLoading || userError) {
    return (
      <LoadingScreen
        userLoading={userLoading ?? true}
        userError={userError ?? true}
      />
    );
  }

  return (
    <div>
      <div className="h-1">
        {(fixedShortcutLoading || customShortcutLoading) && <LoadingProgress speed={10} />}
      </div>
      <div className="w-[100%] h-screen px-5 py-3 overflow-scroll flex flex-col justify-between">
        <div>
          <Header user={user} />
          <div className="flex w-full h-14 items-center gap-1.5 p-1 mt-1 py-3 border-b-[1px] border-[#E2E8F0]">
            <Label className="w-[100px] font-thin" htmlFor="profile">Profile</Label>
            {profile && (
              <>
                <Select disabled={profilesLoading} defaultValue={profile.profile_id} onValueChange={async (value: any) => {
                  await deleteCache("shortcut/fixedShortcuts");
                  await updateProfile(value)
                  getFixedShortcuts()
                }}>
                  <SelectTrigger id="profile" className="w-full px-2">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="max-h-32">
                      {
                        profiles.map((profile: any) => (
                          <SelectItem value={profile.profile_id}>{profile.profile_name}</SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Settings</AccordionTrigger>
              <AccordionContent className="flex w-full  items-center gap-1.5 p-1">
                <Label className="w-[100px] font-thin" htmlFor="email">Language</Label>
                <Select defaultValue={settings?.language} onValueChange={(value) => updateSettings({ ...settings, language: value })}>
                  <SelectTrigger id="email" className="w-full h-8 py-1 px-2">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="h-32">
                      {
                        languages.map((language: any) => (
                          <SelectItem value={language}>{language}</SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </AccordionContent>
              <AccordionContent className="flex w-full  items-center gap-1.5 p-1">
                <Label className="w-[100px] font-thin" htmlFor="tone">Tone</Label>
                <Select defaultValue={settings?.tone} onValueChange={(value) => updateSettings({ ...settings, tone: value })}>
                  <SelectTrigger id="tone" className="w-full h-8 py-1 px-2">
                    <SelectValue placeholder="Neutral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="h-32">
                      {
                        tones.map((tone: any) => (
                          <SelectItem value={tone}>{tone}</SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </AccordionContent>
              <AccordionContent className="flex w-full  items-center gap-1.5 p-1">
                <Label className="w-[100px] font-thin" htmlFor="style">Style</Label>
                <Select defaultValue={settings?.writingStyle} onValueChange={(value) => updateSettings({ ...settings, writingStyle: value })}>
                  <SelectTrigger id="style" className="w-full h-8 py-1 px-2">
                    <SelectValue placeholder="Informal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup className="h-32">
                      {
                        writingStyles.map((writingStyle: any) => (
                          <SelectItem value={writingStyle}>{writingStyle}</SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible defaultValue="item-1" disabled={fixedShortcutLoading}>
            <AccordionItem value="item-1">
              <AccordionTrigger>Main Functions</AccordionTrigger>
              {fixedShortcuts?.map((shortcut) => (
                <AccordionContent className="flex w-full  justify-start items-center gap-1.5 p-1">
                  <div className="w-[100px] font-thin"><Badges shortucts={shortcut.shortcut_keys}></Badges></div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="border-grey-50 py-1 px-2 rounded border-[1px] w-full whitespace-nowrap overflow-scroll cursor-pointer">
                          {shortcut.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="w-[300px] text-wrap shadow-sm">
                          {shortcut.description}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </AccordionContent>
              ))}
            </AccordionItem>
          </Accordion>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Custom Functions</AccordionTrigger>
              <AccordionContent className="flex flex-col w-full  justify-end items-center gap-1.5">
                {user?.subscriptionDetails === null && (
                  <div className="flex flex-col justify-center items-center">
                    <Button onClick={() => window.open("https://belikenative.com/#pricing", "_blank")} variant={"default"} className="w-full bg-secondary font-thin" >Upgrade to Premium</Button>
                    <div className="font-bold text-lg mt-2">Benefits</div>
                    <div className="flex flex-col">
                      <div className="flex gap-1 items-center">
                        <CheckCircle size="15px" /> <span>Unlimited access to the functions</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <CheckCircle size="15px" /> <span>Create and use custom functions</span>
                      </div>
                    </div>
                  </div>
                )}
                {user?.subscriptionDetails !== null && (
                  <>
                    {!showAddInput && <Button className="w-full" onClick={() => setShowAddInput(!showAddInput)}>Add Custom Function</Button>}
                    {showAddInput &&
                      <div className="flex flex-col w-full  justify-end items-center gap-1.5 p-1">
                        <div className="w-full font-thin">Keyboard Input</div>
                        <div className="w-full flex gap-1 justify-between items-center border-[1px] p-1 rounded-md">
                          <div className="w-full">
                            {editError && <div className="text-xs text-red-400">{editError}</div>}
                            {pressedKey && !editError &&
                              <div className="w-fit">
                                <Badges shortucts={pressedKey}></Badges>
                              </div>
                            }
                            {
                              !canTakeKeyboardInput && !pressedKey && !editError &&
                              <div className="text-xs text-gray-400">Switch the button to take keyboard input</div>
                            }
                            {
                              canTakeKeyboardInput && !pressedKey && !editError &&
                              <div className="text-xs text-gray-400">Now type on the keyboard</div>
                            }
                          </div>
                          {pressedKey && canTakeKeyboardInput &&
                            <Button className="size-7 p-2" variant={"destructive"} size={"sm"} onClick={() => setPressedKey('')}>
                              <EraserIcon className="size-3" />
                            </Button>
                          }
                          <Button disabled={editID !== null} className="size-7 p-2" size={"sm"} variant={canTakeKeyboardInput ? "default" : "outline"} onClick={() => { setCanTakeKeyboardInput(!canTakeKeyboardInput); setEditError(null); }}>{canTakeKeyboardInput ? <ToggleRightIcon className="size-3" /> : <ToggleLeftIcon className="size-3" />}</Button>
                        </div>
                        <div className="w-full">
                          <Label className="w-[100px] mb-16 font-thin" htmlFor="prompt">Instruction</Label>
                          <Textarea className="py-1 px-2" onChange={(event) => setCustomInstruction(event.target.value)} id="prompt" placeholder="Type your instruction here" defaultValue={
                            customShortcuts?.filter((customShortcut) => customShortcut?.shortcut_id === editID).length !== 0 ? customShortcuts?.filter((customShortcut) => customShortcut.shortcut_id === editID)[0].prompt : ''
                          } />
                          <div className="flex items-center gap-1 my-2">
                            <InfoIcon size={15} color="#eab308" />
                            <div className="text-yellow-500 text-xs">
                              Make the instructions as clear as possible for better output.
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-5 w-full justify-end">
                          <Button
                            disabled={!pressedKey || !customInstruction}
                            className="w-full"
                            onClick={() => {
                              setShowAddInput(!showAddInput)
                              if (editID) {
                                updateShortcut()
                              } else if (pressedKey && customInstruction) {
                                createCustomShortcut({ shortcut_keys: pressedKey, prompt: customInstruction })
                              }
                            }}
                          >
                            Save Function
                          </Button>
                          <Button
                            variant={"destructive"}
                            className="w-full"
                            onClick={() => {
                              setShowAddInput(!showAddInput)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>}
                  </>
                )}
              </AccordionContent>
              {user?.subscriptionDetails !== null && !showAddInput && customShortcuts?.map((shortcut) => (
                <AccordionContent className="flex w-full  justify-start items-center gap-1.5">
                  <div className="w-[150px] font-thin"><Badges shortucts={shortcut.shortcut_keys}></Badges></div>
                  <div className="w-full text-wrap shadow-sm border-grey-50 py-1 px-2 rounded border-[1px]">
                    {shortcut.prompt}
                  </div>
                  <Button variant={"outline"} className="size-7 p-2" size={"sm"} onClick={() => {
                    setPressedKey(shortcut.shortcut_keys);
                    setCustomInstruction(shortcut.prompt ?? '');
                    setShowAddInput(true);
                    setEditID(shortcut.shortcut_id);
                  }
                  }>
                    <Edit2Icon className="size-3" />
                  </Button>
                  <Button
                    variant={"destructive"}
                    size={"sm"}
                    className="size-7 p-2"
                    onClick={() => {
                      // setCustomShortcuts(customShortcuts.filter((customShortcut) => customShortcut.shortcut_id !== shortcut.shortcut_id))
                      deleteCustomShortcut(shortcut.shortcut_id);
                    }}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </AccordionContent>
              ))}
            </AccordionItem>
          </Accordion>
        </div>

        <Footer />
      </div>
    </div>
  );
};


export default SidePanel;
