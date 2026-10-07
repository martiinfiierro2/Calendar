-- Esquema de main ce95b98, sin filas ni credenciales.
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11 (Debian 17.11-0+deb13u1)
-- Dumped by pg_dump version 17.11 (Debian 17.11-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_comidas_modo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_comidas_modo AS ENUM (
    'receta',
    'rapida'
);


--
-- Name: enum_recetas_dificultad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_recetas_dificultad AS ENUM (
    'Fácil',
    'Media',
    'Difícil'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comidas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comidas (
    id integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    nombre character varying(120) NOT NULL,
    tipo character varying(30) DEFAULT 'comida'::character varying NOT NULL,
    icono character varying(16),
    modo public.enum_comidas_modo NOT NULL,
    ingredientes json,
    procesada boolean DEFAULT false NOT NULL,
    "usuarioId" integer NOT NULL,
    "recetaId" integer,
    "creadoEn" timestamp with time zone NOT NULL,
    "actualizadoEn" timestamp with time zone NOT NULL
);


--
-- Name: comidas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comidas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comidas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comidas_id_seq OWNED BY public.comidas.id;


--
-- Name: consumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consumos (
    id integer NOT NULL,
    "nombreProducto" character varying(160) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    "comidaNombre" character varying(120) NOT NULL,
    "usuarioId" integer NOT NULL,
    "comidaId" integer,
    "recetaId" integer,
    "creadoEn" timestamp with time zone NOT NULL,
    "actualizadoEn" timestamp with time zone NOT NULL
);


--
-- Name: consumos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consumos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consumos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consumos_id_seq OWNED BY public.consumos.id;


--
-- Name: lista_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lista_compra (
    id integer NOT NULL,
    nombre character varying(160) NOT NULL,
    cantidad numeric(10,2) DEFAULT 1 NOT NULL,
    unidad character varying(20) DEFAULT 'ud'::character varying NOT NULL,
    categoria character varying(60) DEFAULT 'Otros'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'apuntado'::character varying NOT NULL,
    automatico boolean DEFAULT false NOT NULL,
    "usuarioId" integer NOT NULL,
    "creadoEn" timestamp with time zone NOT NULL,
    "actualizadoEn" timestamp with time zone NOT NULL
);


--
-- Name: lista_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lista_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lista_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lista_compra_id_seq OWNED BY public.lista_compra.id;


--
-- Name: recetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recetas (
    id integer NOT NULL,
    nombre character varying(120) NOT NULL,
    categoria character varying(50) DEFAULT 'Otros'::character varying NOT NULL,
    tiempo integer DEFAULT 30 NOT NULL,
    raciones integer DEFAULT 2 NOT NULL,
    dificultad public.enum_recetas_dificultad DEFAULT 'Fácil'::public.enum_recetas_dificultad NOT NULL,
    favorito boolean DEFAULT false NOT NULL,
    imagen text,
    ingredientes json DEFAULT '[]'::json NOT NULL,
    pasos json DEFAULT '[]'::json NOT NULL,
    "usuarioId" integer NOT NULL,
    "creadoEn" timestamp with time zone NOT NULL,
    "actualizadoEn" timestamp with time zone NOT NULL
);


--
-- Name: recetas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recetas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recetas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recetas_id_seq OWNED BY public.recetas.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    email character varying(160) NOT NULL,
    "hashContrasena" character varying(255) NOT NULL,
    recordatorios boolean DEFAULT true NOT NULL,
    "creadoEn" timestamp with time zone NOT NULL,
    "actualizadoEn" timestamp with time zone NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: comidas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comidas ALTER COLUMN id SET DEFAULT nextval('public.comidas_id_seq'::regclass);


--
-- Name: consumos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumos ALTER COLUMN id SET DEFAULT nextval('public.consumos_id_seq'::regclass);


--
-- Name: lista_compra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lista_compra ALTER COLUMN id SET DEFAULT nextval('public.lista_compra_id_seq'::regclass);


--
-- Name: recetas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recetas ALTER COLUMN id SET DEFAULT nextval('public.recetas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: comidas comidas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comidas
    ADD CONSTRAINT comidas_pkey PRIMARY KEY (id);


--
-- Name: consumos consumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumos
    ADD CONSTRAINT consumos_pkey PRIMARY KEY (id);


--
-- Name: lista_compra lista_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lista_compra
    ADD CONSTRAINT lista_compra_pkey PRIMARY KEY (id);


--
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: comidas comidas_recetaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comidas
    ADD CONSTRAINT "comidas_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES public.recetas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comidas comidas_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comidas
    ADD CONSTRAINT "comidas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consumos consumos_comidaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumos
    ADD CONSTRAINT "consumos_comidaId_fkey" FOREIGN KEY ("comidaId") REFERENCES public.comidas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: consumos consumos_recetaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumos
    ADD CONSTRAINT "consumos_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES public.recetas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: consumos consumos_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consumos
    ADD CONSTRAINT "consumos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lista_compra lista_compra_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lista_compra
    ADD CONSTRAINT "lista_compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recetas recetas_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recetas
    ADD CONSTRAINT "recetas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


SET search_path TO public;
