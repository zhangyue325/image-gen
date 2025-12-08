'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type StyleId = string;

type GenerationStatus = 'idle' | 'loading' | 'ready' | 'error';

type GenerationResult = {
  status: GenerationStatus;
  imageUrl?: string;
  error?: string;
  generatedAt?: string;
};

type StyleKind = 'preset' | 'custom';

type StyleOptionBase = {
  id: StyleId;
  title: string;
  description: string;
  kind: StyleKind;
  sampleOriginal?: string;
  sampleResult?: string;
};

type PresetStyleOption = StyleOptionBase & {
  kind: 'preset';
  sampleOriginal: string;
  sampleResult: string;
};

type CustomStyleOption = StyleOptionBase & {
  kind: 'custom';
  prompt: string;
};

type StyleOption = PresetStyleOption | CustomStyleOption;

type RatioOption = {
  value: string;
  label: string;
};

type WizardContextValue = {
  customStyles: CustomStyleOption[];
  allStyles: StyleOption[];
  stylesLookup: Record<StyleId, StyleOption>;
  selectedStyles: StyleId[];
  setSelectedStyleIds: (styles: StyleId[]) => void;
  toggleStyle: (styleId: StyleId) => void;
  selectStyle: (styleId: StyleId) => void;
  deselectStyle: (styleId: StyleId) => void;
  addCustomStyle: (style: CustomStyleOption) => void;
  updateCustomStyle: (styleId: StyleId, updates: Partial<CustomStyleOption>) => void;
  deleteCustomStyle: (styleId: StyleId) => void;
  ratio: string;
  ratioOptions: RatioOption[];
  setRatio: (value: string) => void;
  productFile: File | null;
  productPreview: string | null;
  setProductImage: (file: File) => void;
  results: Record<StyleId, GenerationResult>;
  requestedStyles: StyleId[];
  globalError: string | null;
  setGlobalError: (value: string | null) => void;
  isGenerating: boolean;
  styleFeedback: Record<StyleId, string>;
  updateStyleFeedback: (styleId: StyleId, value: string) => void;
  startGeneration: (styles?: StyleId[], options?: { includeFeedback?: boolean }) => Promise<boolean>;
  downloadImage: (styleId: StyleId) => void;
};

const PRESET_STYLES: PresetStyleOption[] = [
  {
    id: 'product w CTA',
    title: 'Product with CTA',
    description:
      'Studio shot with strong call-to-action, balanced whitespace, and a focal product display.',
    sampleOriginal: '/samples/dummy_image.jpg',
    sampleResult: '/samples/dummy_image.jpg',
    kind: 'preset'
  },
  {
    id: 'model from bottom calf',
    title: 'Model From Bottom Calf',
    description:
      'Lifestyle crop that showcases the footwear on a model from the calf down in an elegant pose.',
    sampleOriginal: '/samples/dummy_image.jpg',
    sampleResult: '/samples/dummy_image.jpg',
    kind: 'preset'
  },
  {
    id: 'comfort lifestyle',
    title: 'Comfort Lifestyle',
    description:
      'Relaxed storytelling that emphasizes softness, warmth, and day-in-the-life contexts.',
    sampleOriginal: '/samples/dummy_image.jpg',
    sampleResult: '/samples/dummy_image.jpg',
    kind: 'preset'
  },
  {
    id: 'editorial power fashion',
    title: 'Editorial Power Fashion',
    description:
      'Bold outdoor editorial framing with confident energy and secondary detail callouts.',
    sampleOriginal: '/samples/dummy_image.jpg',
    sampleResult: '/samples/dummy_image.jpg',
    kind: 'preset'
  }
];

const PRESET_STYLE_IDS = PRESET_STYLES.map((style) => style.id);

const RATIO_OPTIONS: RatioOption[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:5', label: 'Portrait (4:5)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '2:3', label: 'Portrait (2:3)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Vertical (9:16)' }
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const CUSTOM_STYLE_STORAGE_KEY = 'ai-ads-custom-styles';

const createInitialResults = (styleIds: StyleId[]): Record<StyleId, GenerationResult> => {
  const initial: Record<StyleId, GenerationResult> = {};
  styleIds.forEach((styleId) => {
    initial[styleId] = { status: 'idle' };
  });
  return initial;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export const WizardProvider = ({ children }: { children: React.ReactNode }) => {
  const [customStyles, setCustomStyles] = useState<CustomStyleOption[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<StyleId[]>(PRESET_STYLE_IDS);
  const [ratio, setRatio] = useState<string>(RATIO_OPTIONS[0].value);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Record<StyleId, GenerationResult>>(() =>
    createInitialResults(PRESET_STYLE_IDS)
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [requestedStyles, setRequestedStyles] = useState<StyleId[]>([]);
  const [styleFeedback, setStyleFeedback] = useState<Record<StyleId, string>>({});

  const isGenerating = activeRequests > 0;

  const allStyles = useMemo<StyleOption[]>(() => [...PRESET_STYLES, ...customStyles], [customStyles]);
  const stylesLookup = useMemo<Record<StyleId, StyleOption>>(() => {
    return allStyles.reduce<Record<StyleId, StyleOption>>((acc, style) => {
      acc[style.id] = style;
      return acc;
    }, {});
  }, [allStyles]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CUSTOM_STYLE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validStyles = parsed
            .filter((item: unknown) => item && typeof item === 'object')
            .map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ''),
              title: String(item.title ?? ''),
              description: String(item.description ?? ''),
              prompt: String(item.prompt ?? ''),
              sampleOriginal: item.sampleOriginal ? String(item.sampleOriginal) : '',
              sampleResult: item.sampleResult ? String(item.sampleResult) : '',
              kind: 'custom' as const
            }))
            .filter((item) => item.id && item.title && item.prompt);
          if (validStyles.length) {
            setCustomStyles(validStyles);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load custom styles from storage.', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(CUSTOM_STYLE_STORAGE_KEY, JSON.stringify(customStyles));
    } catch (error) {
      console.warn('Failed to persist custom styles.', error);
    }
  }, [customStyles]);

  useEffect(() => {
    const allowedIds = new Set(allStyles.map((style) => style.id));

    setResults((prev) => {
      let mutated = false;
      const next: Record<StyleId, GenerationResult> = { ...prev };

      allowedIds.forEach((id) => {
        if (!next[id]) {
          next[id] = { status: 'idle' };
          mutated = true;
        }
      });

      Object.keys(next).forEach((id) => {
        if (!allowedIds.has(id)) {
          delete next[id];
          mutated = true;
        }
      });

      return mutated ? next : prev;
    });

    setSelectedStyles((prev) => {
      const filtered = prev.filter((id) => allowedIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });

    setRequestedStyles((prev) => {
      const filtered = prev.filter((id) => allowedIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });

    setStyleFeedback((prev) => {
      let mutated = false;
      const next: Record<StyleId, string> = {};
      Object.entries(prev).forEach(([id, value]) => {
        if (allowedIds.has(id)) {
          next[id] = value;
        } else {
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [allStyles]);

  const toggleStyle = (styleId: StyleId) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        return prev.filter((id) => id !== styleId);
      }
      return [...prev, styleId];
    });
  };

  const selectStyle = (styleId: StyleId) => {
    setSelectedStyles((prev) => (prev.includes(styleId) ? prev : [...prev, styleId]));
  };

  const setSelectedStyleIds = (styles: StyleId[]) => {
    setSelectedStyles(styles);
  };

  const deselectStyle = (styleId: StyleId) => {
    setSelectedStyles((prev) => prev.filter((id) => id !== styleId));
  };

  const addCustomStyle = (style: CustomStyleOption) => {
    setCustomStyles((prev) => [...prev, style]);
    setSelectedStyles((prev) => [...prev, style.id]);
  };

  const updateCustomStyle = (styleId: StyleId, updates: Partial<CustomStyleOption>) => {
    setCustomStyles((prev) =>
      prev.map((style) => (style.id === styleId ? { ...style, ...updates } : style))
    );
  };

  const deleteCustomStyle = (styleId: StyleId) => {
    setCustomStyles((prev) => prev.filter((style) => style.id !== styleId));
  };

  const setProductImage = (file: File) => {
    setProductFile(file);
    setGlobalError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setProductPreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const updateResultStatuses = useCallback((styles: StyleId[], status: GenerationStatus) => {
    setResults((prev) => {
      const next = { ...prev };
      styles.forEach((style) => {
        const previous = prev[style] ?? { status: 'idle' as GenerationStatus };
        next[style] = {
          ...previous,
          status,
          error: status === 'error' ? previous.error : undefined
        };
      });
      return next;
    });
  }, []);

  const requestGeneration = useCallback(
    async (stylesToGenerate: StyleId[], options?: { includeFeedback?: boolean }) => {
      if (!productFile) {
        setGlobalError('Please upload a product image before generating creatives.');
        return false;
      }
      if (!stylesToGenerate.length) {
        setGlobalError('Select at least one style to generate.');
        return false;
      }

      const includeFeedback = options?.includeFeedback ?? false;

      setRequestedStyles(stylesToGenerate);
      updateResultStatuses(stylesToGenerate, 'loading');
      setGlobalError(null);
      setActiveRequests((count) => count + 1);

      try {
        const formData = new FormData();
        formData.append('ratio', ratio);
        formData.append('styles', JSON.stringify(stylesToGenerate));
        formData.append('product', productFile);

        const customPromptPayload = stylesToGenerate.reduce<Record<string, string>>((acc, styleId) => {
          const style = stylesLookup[styleId];
          if (style && style.kind === 'custom') {
            const prompt = style.prompt.trim();
            if (prompt) {
              acc[styleId] = prompt;
            }
          }
          return acc;
        }, {});
        if (Object.keys(customPromptPayload).length > 0) {
          formData.append('customPrompts', JSON.stringify(customPromptPayload));
        }

        if (includeFeedback) {
          const feedbackPayload = stylesToGenerate.reduce<Record<string, string>>((acc, style) => {
            const feedback = styleFeedback[style]?.trim();
            if (feedback) {
              acc[style] = feedback;
            }
            return acc;
          }, {});
          if (Object.keys(feedbackPayload).length > 0) {
            formData.append('instructions', JSON.stringify(feedbackPayload));
          }
        }

        const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Generation failed with status ${response.status}`);
        }

        const payload: {
          images?: Record<string, string>;
          errors?: Record<string, string>;
        } = await response.json();

        setResults((prev) => {
          const next = { ...prev };
          stylesToGenerate.forEach((style) => {
            const imageUrl = payload.images?.[style];
            const errorMessage = payload.errors?.[style];

            if (imageUrl) {
              next[style] = {
                status: 'ready',
                imageUrl,
                generatedAt: new Date().toISOString()
              };
            } else {
              next[style] = {
                status: 'error',
                error: errorMessage || 'No image returned for this style.'
              };
            }
          });
          return next;
        });

        if (payload.errors) {
          const remainingErrors = Object.entries(payload.errors)
            .filter(([style]) => stylesToGenerate.includes(style as StyleId))
            .map(([, message]) => message)
            .join(' ');
          if (remainingErrors) {
            setGlobalError(remainingErrors);
          }
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation request failed.';
        setGlobalError(message);
        setResults((prev) => {
          const next = { ...prev };
          stylesToGenerate.forEach((style) => {
            next[style] = { status: 'error', error: message };
          });
          return next;
        });
        return false;
      } finally {
        setActiveRequests((count) => Math.max(0, count - 1));
      }
    },
    [productFile, ratio, styleFeedback, stylesLookup, updateResultStatuses]
  );

  const startGeneration = useCallback(
    (styles?: StyleId[], options?: { includeFeedback?: boolean }) => {
      const targetStyles = styles ?? selectedStyles;
      return requestGeneration(targetStyles, options);
    },
    [requestGeneration, selectedStyles]
  );

  const updateStyleFeedback = (styleId: StyleId, value: string) => {
    setStyleFeedback((prev) => ({ ...prev, [styleId]: value }));
  };

  const downloadImage = (styleId: StyleId) => {
    const imageUrl = results[styleId]?.imageUrl;
    if (!imageUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${styleId.replace(/\s+/g, '-')}-creative.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const value: WizardContextValue = {
    customStyles,
    allStyles,
    stylesLookup,
    selectedStyles,
    setSelectedStyleIds,
    toggleStyle,
    selectStyle,
    deselectStyle,
    addCustomStyle,
    updateCustomStyle,
    deleteCustomStyle,
    ratio,
    ratioOptions: RATIO_OPTIONS,
    setRatio,
    productFile,
    productPreview,
    setProductImage,
    results,
    requestedStyles,
    globalError,
    setGlobalError,
    isGenerating,
    styleFeedback,
    updateStyleFeedback,
    startGeneration,
    downloadImage
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

export type {
  CustomStyleOption,
  GenerationResult,
  GenerationStatus,
  PresetStyleOption,
  RatioOption,
  StyleId,
  StyleOption
};

export { PRESET_STYLES, RATIO_OPTIONS };
